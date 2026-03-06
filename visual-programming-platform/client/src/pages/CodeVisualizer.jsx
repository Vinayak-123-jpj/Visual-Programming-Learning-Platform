import { useState, useRef, useEffect, useCallback, useMemo } from "react";

// ============================================================
// MONACO LOADER UTILITY
// ============================================================
let monacoLoaded = false;
let monacoLoadCallbacks = [];

function loadMonaco(callback) {
  if (monacoLoaded) {
    callback();
    return;
  }
  monacoLoadCallbacks.push(callback);
  if (monacoLoadCallbacks.length > 1) return;
  const script = document.createElement("script");
  script.src =
    "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js";
  script.onload = () => {
    window.require.config({
      paths: {
        vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs",
      },
    });
    window.require(["vs/editor/editor.main"], () => {
      monacoLoaded = true;
      monacoLoadCallbacks.forEach((cb) => cb());
      monacoLoadCallbacks = [];
    });
  };
  document.head.appendChild(script);
}

// ============================================================
// EXECUTION ENGINE — Tokenizer / Parser / Interpreter
// (All original logic preserved + explanationBeginner added)
// ============================================================
function evalExpr(expr, scope) {
  expr = expr.trim();
  if (
    (expr.startsWith('"') && expr.endsWith('"')) ||
    (expr.startsWith("'") && expr.endsWith("'"))
  ) {
    return expr.slice(1, -1);
  }
  if (/^-?\d+$/.test(expr)) return parseInt(expr, 10);
  if (/^-?\d+\.\d+$/.test(expr)) return parseFloat(expr);
  if (expr === "True") return true;
  if (expr === "False") return false;
  if (expr === "None") return null;

  // ---- List literal: [1, 2, 3] or [] ----
  if (expr.startsWith("[") && expr.endsWith("]")) {
    const inner = expr.slice(1, -1).trim();
    if (inner === "") return { __list: true, items: [] };
    const items = splitByCommaTopLevel(inner).map((i) =>
      evalExpr(i.trim(), scope),
    );
    return { __list: true, items };
  }

  // ---- Dict literal: {"a": 1, "b": 2} or {} ----
  if (expr.startsWith("{") && expr.endsWith("}")) {
    const inner = expr.slice(1, -1).trim();
    if (inner === "") return { __dict: true, entries: [] };
    const pairs = splitByCommaTopLevel(inner);
    const entries = pairs.map((pair) => {
      const colonIdx = pair.indexOf(":");
      if (colonIdx === -1) return { key: pair.trim(), value: null };
      const k = evalExpr(pair.slice(0, colonIdx).trim(), scope);
      const v = evalExpr(pair.slice(colonIdx + 1).trim(), scope);
      return { key: k, value: v };
    });
    return { __dict: true, entries };
  }

  // ---- Tuple: (1, 2, 3) ----
  if (expr.startsWith("(") && expr.endsWith(")")) {
    const inner = expr.slice(1, -1).trim();
    if (inner === "") return { __tuple: true, items: [] };
    const items = splitByCommaTopLevel(inner).map((i) =>
      evalExpr(i.trim(), scope),
    );
    return { __tuple: true, items };
  }

  if (/^[a-zA-Z_]\w*$/.test(expr)) {
    return scope[expr] !== undefined ? scope[expr] : 0;
  }

  // ---- List/dict index access: mylist[0], mydict["key"] ----
  const indexMatch = expr.match(/^(\w+)\[(.+)\]$/);
  if (indexMatch) {
    const [, varName, keyExpr] = indexMatch;
    const obj = scope[varName];
    const key = evalExpr(keyExpr.trim(), scope);
    if (obj && obj.__list)
      return obj.items[key] !== undefined ? obj.items[key] : null;
    if (obj && obj.__dict) {
      const entry = obj.entries.find((e) => e.key === key);
      return entry ? entry.value : null;
    }
    if (Array.isArray(obj)) return obj[key] !== undefined ? obj[key] : null;
    return null;
  }

  // ---- list.append / list.pop style calls ----
  const methodCallMatch = expr.match(/^(\w+)\.(\w+)\(([^)]*)\)$/);
  if (methodCallMatch) {
    const [, varName, method, argsRaw] = methodCallMatch;
    const obj = scope[varName];
    const args = argsRaw.trim()
      ? splitByCommaTopLevel(argsRaw).map((a) => evalExpr(a.trim(), scope))
      : [];
    if (obj && obj.__list) {
      if (method === "append") {
        obj.items.push(args[0]);
        return null;
      }
      if (method === "pop")
        return obj.items.splice(
          args[0] !== undefined ? args[0] : obj.items.length - 1,
          1,
        )[0];
      if (method === "len" || method === "length") return obj.items.length;
    }
    return null;
  }

  const funcCallMatch = expr.match(/^(\w+)\((.+)\)$/);
  if (funcCallMatch) {
    const [, fnName, argsStr] = funcCallMatch;
    const args = splitByCommaTopLevel(argsStr).map((a) =>
      evalExpr(a.trim(), scope),
    );
    if (fnName === "range") {
      if (args.length === 1)
        return { __range: true, start: 0, stop: args[0], step: 1 };
      if (args.length === 2)
        return { __range: true, start: args[0], stop: args[1], step: 1 };
      return { __range: true, start: args[0], stop: args[1], step: args[2] };
    }
    if (fnName === "len") {
      const arg = args[0];
      if (arg && arg.__list) return arg.items.length;
      if (arg && arg.__dict) return arg.entries.length;
      if (arg && arg.__tuple) return arg.items.length;
      if (typeof arg === "string") return arg.length;
      return 0;
    }
    if (fnName === "list") {
      if (args[0] && args[0].__range) {
        const items = [];
        for (let v = args[0].start; v < args[0].stop; v += args[0].step)
          items.push(v);
        return { __list: true, items };
      }
      return { __list: true, items: [] };
    }
    return { __call: true, fnName, args };
  }

  // ---- Empty function call: func() ----
  const emptyCallMatch = expr.match(/^(\w+)\(\)$/);
  if (emptyCallMatch) {
    return { __call: true, fnName: emptyCallMatch[1], args: [] };
  }

  try {
    let safe = expr;
    const varNames = Object.keys(scope).sort((a, b) => b.length - a.length);
    for (const v of varNames) {
      const val = scope[v];
      if (typeof val === "number" || typeof val === "boolean") {
        safe = safe.replace(new RegExp(`\\b${v}\\b`, "g"), String(val));
      }
    }
    if (/^[\d\s\+\-\*\/\%\(\)\.]+$/.test(safe)) {
      // eslint-disable-next-line no-new-func
      return Function('"use strict"; return (' + safe + ")")();
    }
  } catch {}
  return 0;
}

// Split a comma-separated string respecting nested brackets/parens/quotes
function splitByCommaTopLevel(str) {
  const parts = [];
  let depth = 0;
  let current = "";
  let inStr = false;
  let strChar = "";
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (inStr) {
      current += ch;
      if (ch === strChar && str[i - 1] !== "\\") inStr = false;
    } else if (ch === '"' || ch === "'") {
      inStr = true;
      strChar = ch;
      current += ch;
    } else if (ch === "(" || ch === "[" || ch === "{") {
      depth++;
      current += ch;
    } else if (ch === ")" || ch === "]" || ch === "}") {
      depth--;
      current += ch;
    } else if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current);
  return parts;
}

// ---- Extract heap objects (lists, dicts, tuples) from a scope snapshot ----
function extractHeapObjects(scope) {
  const heap = [];
  for (const [name, val] of Object.entries(scope)) {
    if (name === "__return") continue;
    if (val && typeof val === "object") {
      if (val.__list) heap.push({ name, type: "list", data: val.items });
      else if (val.__dict) heap.push({ name, type: "dict", data: val.entries });
      else if (val.__tuple) heap.push({ name, type: "tuple", data: val.items });
    }
  }
  return heap;
}

// ============================================================
// STEP GENERATOR
// ============================================================
function formatValue(val) {
  // Internal list
  if (val && val.__list && Array.isArray(val.items)) {
    return "[" + val.items.map((v) => formatValue(v)).join(", ") + "]";
  }

  // Internal dict
  if (val && val.__dict && Array.isArray(val.entries)) {
    const entries = val.entries.map((e) => {
      return `"${e.key}": ${formatValue(e.value)}`;
    });
    return "{" + entries.join(", ") + "}";
  }

  // Internal tuple
  if (val && val.__tuple && Array.isArray(val.items)) {
    return "(" + val.items.map((v) => formatValue(v)).join(", ") + ")";
  }

  // Normal JS array (fallback)
  if (Array.isArray(val)) {
    return "[" + val.map((v) => formatValue(v)).join(", ") + "]";
  }

  // Normal object (fallback)
  if (val && typeof val === "object") {
    const entries = Object.entries(val).map(
      ([k, v]) => `"${k}": ${formatValue(v)}`,
    );
    return "{" + entries.join(", ") + "}";
  }

  return String(val);
}

function generateSteps(source) {
  const lines = source.split("\n");
  const steps = [];
  const globalScope = {};
  const funcDefs = {};

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    const defMatch = line.match(/^def\s+(\w+)\(([^)]*)\)\s*:/);
    if (defMatch) {
      const [, fnName, paramsStr] = defMatch;
      const params = paramsStr
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      const body = [];
      let j = i + 1;
      while (
        j < lines.length &&
        (lines[j].startsWith("    ") ||
          lines[j].startsWith("\t") ||
          lines[j].trim() === "")
      ) {
        body.push(lines[j]);
        j++;
      }
      funcDefs[fnName] = { params, body, startLine: i };
      i = j;
    } else {
      i++;
    }
  }

  function buildFrames(callStack, scope) {
    const frames = [
      {
        name: "global",
        vars: { ...globalScope },
        active: callStack.length === 0,
      },
    ];
    callStack.forEach((cs, idx) => {
      frames.push({ name: cs, vars: {}, active: idx === callStack.length - 1 });
    });
    if (frames.length > 1) {
      frames[frames.length - 1].vars = { ...scope };
    } else {
      frames[0].vars = { ...scope };
    }
    return frames;
  }

  function processBlock(blockLines, scope, lineOffset, callStack, depth) {
    let idx = 0;
    while (idx < blockLines.length) {
      const rawLine = blockLines[idx];
      const line = rawLine.trim();
      const lineNum = lineOffset + idx;

      if (!line || line.startsWith("#")) {
        idx++;
        continue;
      }

      // Function def — skip body
      if (line.match(/^def\s+/)) {
        steps.push({
          line: lineNum,
          explanation: `Defining function: ${line}`,
          explanationBeginner: `We're creating a reusable block of code called a "function". Its name tells us what it does.`,
          scope: { ...scope },
          callStack: [...callStack],
          output: null,
          heapNote: null,
          loopInfo: null,
          stackFrames: buildFrames(callStack, scope),
          type: "funcdef",
        });
        let j = idx + 1;
        while (
          j < blockLines.length &&
          (blockLines[j].startsWith("    ") || blockLines[j].startsWith("\t"))
        )
          j++;
        idx = j;
        continue;
      }

      // Return statement
      const retMatch = line.match(/^return\s+(.*)/);
      if (retMatch) {
        const retExpr = retMatch[1].trim();
        const retVal = evalExpr(retExpr, scope);
        if (retVal && typeof retVal === "object" && retVal.__call) {
          const result = executeRecursive(
            retVal.fnName,
            retVal.args,
            scope,
            callStack,
            depth,
            steps,
            funcDefs,
            lineNum,
          );
          steps.push({
            line: lineNum,
            explanation: `↩ Returning from ${callStack[callStack.length - 1] || "main"}: ${result}`,
            explanationBeginner: `We finished this function call and are sending back the answer: ${result}. Think of it like handing back a result.`,
            scope: { ...scope },
            callStack: [...callStack],
            output: null,
            heapNote: null,
            loopInfo: null,
            stackFrames: buildFrames(callStack, scope),
            type: "return",
            returnValue: result,
          });
          scope.__return = result;
          return result;
        }
        steps.push({
          line: lineNum,
          explanation: `↩ Returning from ${callStack[callStack.length - 1] || "main"}: ${retVal}`,
          explanationBeginner: `This function is done! It's sending back the value ${retVal}.`,
          scope: { ...scope },
          callStack: [...callStack],
          output: null,
          heapNote: null,
          loopInfo: null,
          stackFrames: buildFrames(callStack, scope),
          type: "return",
          returnValue: retVal,
        });
        scope.__return = retVal;
        return retVal;
      }

      // if statement
      const ifMatch = line.match(/^if\s+(.+)\s*:/);
      if (ifMatch) {
        const cond = evalExpr(ifMatch[1], scope);
        steps.push({
          line: lineNum,
          explanation: `Evaluating condition: [${ifMatch[1]}] → ${cond ? "TRUE ✓" : "FALSE ✗"} — ${cond ? "entering branch" : "skipping branch"}`,
          explanationBeginner: `We're asking a yes/no question: "${ifMatch[1]}". The answer is ${cond ? "YES, so we go inside." : "NO, so we skip this part."}`,
          scope: { ...scope },
          callStack: [...callStack],
          output: null,
          heapNote: null,
          loopInfo: null,
          stackFrames: buildFrames(callStack, scope),
          type: "condition",
          condResult: !!cond,
        });
        if (cond) {
          const ifBody = [];
          let j = idx + 1;
          while (
            j < blockLines.length &&
            (blockLines[j].startsWith("    ") || blockLines[j].startsWith("\t"))
          ) {
            ifBody.push(blockLines[j].replace(/^    /, "").replace(/^\t/, ""));
            j++;
          }
          const result = processBlock(
            ifBody,
            scope,
            lineOffset + idx + 1,
            callStack,
            depth,
          );
          if (result !== undefined) return result;
          idx = j;
        } else {
          let j = idx + 1;
          while (
            j < blockLines.length &&
            (blockLines[j].startsWith("    ") || blockLines[j].startsWith("\t"))
          )
            j++;
          idx = j;
        }
        continue;
      }

      // for loop
      const forMatch = line.match(/^for\s+(\w+)\s+in\s+(.+)\s*:/);
      if (forMatch) {
        const [, iterVar, iterExpr] = forMatch;
        const iterObj = evalExpr(iterExpr, scope);
        let iterValues = [];
        if (iterObj && iterObj.__range) {
          for (let v = iterObj.start; v < iterObj.stop; v += iterObj.step)
            iterValues.push(v);
        } else if (Array.isArray(iterObj)) {
          iterValues = iterObj;
        }
        const loopBody = [];
        let j = idx + 1;
        while (
          j < blockLines.length &&
          (blockLines[j].startsWith("    ") || blockLines[j].startsWith("\t"))
        ) {
          loopBody.push(blockLines[j].replace(/^    /, "").replace(/^\t/, ""));
          j++;
        }
        steps.push({
          line: lineNum,
          explanation: `Starting for loop: ${iterVar} ∈ ${iterExpr} — ${iterValues.length} iterations queued`,
          explanationBeginner: `We're starting a loop! This will repeat the code below ${iterValues.length} times, once for each number.`,
          scope: { ...scope },
          callStack: [...callStack],
          output: null,
          heapNote: null,
          loopInfo: { var: iterVar, total: iterValues.length, current: 0 },
          stackFrames: buildFrames(callStack, scope),
          type: "loopstart",
        });
        for (let loopIdx = 0; loopIdx < iterValues.length; loopIdx++) {
          scope[iterVar] = iterValues[loopIdx];
          steps.push({
            line: lineNum,
            explanation: `Loop iteration ${loopIdx + 1}/${iterValues.length}: ${iterVar} ← ${iterValues[loopIdx]}`,
            explanationBeginner: `Loop round ${loopIdx + 1} of ${iterValues.length}: now "${iterVar}" equals ${iterValues[loopIdx]}.`,
            scope: { ...scope },
            callStack: [...callStack],
            output: null,
            heapNote: null,
            loopInfo: {
              var: iterVar,
              total: iterValues.length,
              current: loopIdx + 1,
            },
            stackFrames: buildFrames(callStack, scope),
            type: "loopiter",
          });
          const result = processBlock(
            loopBody,
            scope,
            lineOffset + idx + 1,
            callStack,
            depth,
          );
          if (result !== undefined) return result;
        }
        steps.push({
          line: lineNum,
          explanation: `Loop complete — ${iterVar} exhausted after ${iterValues.length} iterations`,
          explanationBeginner: `The loop is done! We repeated the code ${iterValues.length} times.`,
          scope: { ...scope },
          callStack: [...callStack],
          output: null,
          heapNote: null,
          loopInfo: {
            var: iterVar,
            total: iterValues.length,
            current: iterValues.length,
            done: true,
          },
          stackFrames: buildFrames(callStack, scope),
          type: "loopdone",
        });
        idx = j;
        continue;
      }

      // print() statement
      const printMatch = line.match(/^print\((.+)\)$/);
      if (printMatch) {
        const arg = printMatch[1].trim();
        let printVal;
        if (arg.includes("+")) {
          const parts = arg.split("+").map((p) => p.trim());
          printVal = parts
            .map((p) => {
              const v = evalExpr(p, scope);
              return v !== null && v !== undefined ? String(v) : "";
            })
            .join("");
        } else {
          printVal = evalExpr(arg, scope);
        }
        if (typeof printVal === "string" && printVal.includes("{")) {
          printVal = printVal.replace(/\{([^}]+)\}/g, (_, expr) => {
            const v = evalExpr(expr.trim(), scope);
            return v !== null && v !== undefined ? v : "";
          });
        }
        steps.push({
          line: lineNum,
          explanation: `print(${arg}) → stdout: "${formatValue(printVal)}"`,
          explanationBeginner: `This line shows something on screen. It prints: "${printVal}"`,
          scope: { ...scope },
          callStack: [...callStack],
          output: formatValue(printVal),
          heapNote: null,
          loopInfo: null,
          stackFrames: buildFrames(callStack, scope),
          type: "print",
        });
        idx++;
        continue;
      }

      // Variable assignment: x = expr
      const assignMatch = line.match(/^(\w+)\s*=\s*(.+)$/);
      if (assignMatch) {
        const [, varName, rhs] = assignMatch;
        const val = evalExpr(rhs, scope);
        if (val && typeof val === "object" && val.__call) {
          const result = executeRecursive(
            val.fnName,
            val.args,
            scope,
            callStack,
            depth,
            steps,
            funcDefs,
            lineNum,
          );
          scope[varName] = result;
          steps.push({
            line: lineNum,
            explanation: `${varName} ← ${val.fnName}(${val.args.join(", ")}) = ${result} [function call result stored]`,
            explanationBeginner: `We called the "${val.fnName}" function and stored its answer (${result}) in a box labeled "${varName}".`,
            scope: { ...scope },
            callStack: [...callStack],
            output: null,
            heapNote: null,
            loopInfo: null,
            stackFrames: buildFrames(callStack, scope),
            type: "assign",
            varName,
            varVal: result,
          });
        } else {
          const prevVal = scope[varName];
          scope[varName] = val;
          steps.push({
            line: lineNum,
            explanation: `${varName} ← ${rhs} = ${val}${prevVal !== undefined ? ` (was: ${prevVal})` : " (new variable)"}`,
            explanationBeginner: `We're storing the value ${val} in a box called "${varName}".${prevVal !== undefined ? ` It used to be ${prevVal}.` : " This is brand new!"}`,
            scope: { ...scope },
            callStack: [...callStack],
            output: null,
            heapNote: null,
            loopInfo: null,
            stackFrames: buildFrames(callStack, scope),
            type: "assign",
            varName,
            varVal: val,
            prevVarVal: prevVal,
          });
        }
        idx++;
        continue;
      }

      // Standalone function call
      const callMatch = line.match(/^(\w+)\((.+)\)$/);
      if (callMatch) {
        const [, fnName, argsStr] = callMatch;
        const args = splitByCommaTopLevel(argsStr).map((a) =>
          evalExpr(a.trim(), scope),
        );
        if (funcDefs[fnName]) {
          executeRecursive(
            fnName,
            args,
            scope,
            callStack,
            depth,
            steps,
            funcDefs,
            lineNum,
          );
        }
        idx++;
        continue;
      }

      // Augmented assignment: x += 1
      const augMatch = line.match(/^(\w+)\s*(\+=|-=|\*=|\/=)\s*(.+)$/);
      if (augMatch) {
        const [, varName, op, rhs] = augMatch;
        const rhsVal = evalExpr(rhs, scope);
        const cur = scope[varName] || 0;
        let newVal;
        if (op === "+=") newVal = cur + rhsVal;
        else if (op === "-=") newVal = cur - rhsVal;
        else if (op === "*=") newVal = cur * rhsVal;
        else if (op === "/=") newVal = cur / rhsVal;
        scope[varName] = newVal;
        const opWord =
          op === "+="
            ? "added"
            : op === "-="
              ? "subtracted"
              : op === "*="
                ? "multiplied by"
                : "divided by";
        steps.push({
          line: lineNum,
          explanation: `${varName} ${op} ${rhsVal} → ${cur} ${op.replace("=", "")} ${rhsVal} = ${newVal}`,
          explanationBeginner: `We took "${varName}" (which was ${cur}), ${opWord} ${rhsVal} to it, and now it's ${newVal}.`,
          scope: { ...scope },
          callStack: [...callStack],
          output: null,
          heapNote: null,
          loopInfo: null,
          stackFrames: buildFrames(callStack, scope),
          type: "assign",
          varName,
          varVal: newVal,
          prevVarVal: cur,
        });
        idx++;
        continue;
      }

      // Unknown line
      steps.push({
        line: lineNum,
        explanation: `Executing: ${line}`,
        explanationBeginner: `The computer is running this line of code.`,
        scope: { ...scope },
        callStack: [...callStack],
        output: null,
        heapNote: null,
        loopInfo: null,
        stackFrames: buildFrames(callStack, scope),
        type: "exec",
      });
      idx++;
    }
  }

  function executeRecursive(
    fnName,
    args,
    outerScope,
    callStack,
    depth,
    steps,
    funcDefs,
    callLineNum,
  ) {
    const def = funcDefs[fnName];
    if (!def) return 0;
    const localScope = {};
    def.params.forEach((p, i) => {
      localScope[p] = args[i];
    });
    const newCallStack = [...callStack, `${fnName}(${args.join(", ")})`];
    steps.push({
      line: callLineNum,
      explanation: `📞 CALL ${fnName}(${args.join(", ")}) — new frame pushed onto call stack [depth: ${depth + 1}]`,
      explanationBeginner: `We're calling the "${fnName}" function with the value ${args.join(", ")}. It's like asking a helper to do a job for us.`,
      scope: { ...localScope },
      callStack: newCallStack,
      output: null,
      heapNote: null,
      loopInfo: null,
      stackFrames: buildFrames(newCallStack, localScope),
      type: "call",
      fnName,
      args,
    });
    const result = processBlock(
      def.body,
      localScope,
      def.startLine + 1,
      newCallStack,
      depth + 1,
    );
    steps.push({
      line: callLineNum,
      explanation: `📤 RETURN ${fnName}(${args.join(", ")}) = ${result} — frame popped [depth: ${depth}]`,
      explanationBeginner: `The helper "${fnName}" finished its job and returned the answer: ${result}.`,
      scope: { ...outerScope },
      callStack: [...callStack],
      output: null,
      heapNote: null,
      loopInfo: null,
      stackFrames: buildFrames(callStack, outerScope),
      type: "return_complete",
      fnName,
      returnValue: result,
    });
    return result;
  }

  // Top-level processing
  const topLines = [];
  let ti = 0;
  while (ti < lines.length) {
    const line = lines[ti].trim();
    if (line.match(/^def\s+/)) {
      topLines.push(lines[ti]);
      let j = ti + 1;
      while (
        j < lines.length &&
        (lines[j].startsWith("    ") || lines[j].startsWith("\t"))
      ) {
        topLines.push(lines[j]);
        j++;
      }
      ti = j;
    } else {
      topLines.push(lines[ti]);
      ti++;
    }
  }

  processBlock(topLines, globalScope, 0, [], 0);
  return steps;
}

// ============================================================
// VARIABLE HISTORY BUILDER
// ============================================================
function buildVarHistory(steps) {
  const history = {};
  let prevScope = {};
  steps.forEach((step, idx) => {
    const scope = step.scope || {};
    for (const k of Object.keys(scope)) {
      if (k === "__return") continue;
      const v = scope[k];
      // Skip heap objects from history (they live in heap panel)
      if (
        v &&
        typeof v === "object" &&
        (v.__list || v.__dict || v.__tuple || v.__range)
      )
        continue;
      if (prevScope[k] !== v) {
        if (!history[k]) history[k] = [];
        history[k].push({
          step: idx,
          value: v,
          prevValue: prevScope[k],
          line: step.line,
        });
      }
    }
    prevScope = scope;
  });
  return history;
}

// ============================================================
// REPLAY UTILITY — rebuild accumulated state up to targetIdx
// ============================================================
function replayToStep(steps, targetIdx) {
  if (targetIdx < 0) {
    return {
      outAcc: [],
      scopeAcc: {},
      loopInfoAcc: null,
      callStackAcc: [],
      stackFramesAcc: [],
    };
  }
  let outAcc = [];
  let scopeAcc = {};
  let loopInfoAcc = null;
  let callStackAcc = [];
  let stackFramesAcc = [];
  for (let i = 0; i <= targetIdx && i < steps.length; i++) {
    const s = steps[i];
    if (s.output !== null) outAcc = [...outAcc, s.output];
    scopeAcc = s.scope || {};
    loopInfoAcc = s.loopInfo || null;
    callStackAcc = s.callStack || [];
    stackFramesAcc = s.stackFrames || [];
  }
  return { outAcc, scopeAcc, loopInfoAcc, callStackAcc, stackFramesAcc };
}

// ============================================================
// CSS STYLES
// ============================================================
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,300;0,400;0,600;0,700;1,400&family=Syne:wght@400;600;700;800&display=swap');

  * { box-sizing: border-box; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #2d3748; border-radius: 4px; }

  .cv-root {
    font-family: 'Syne', sans-serif;
    background: #0a0a0f;
    color: #e2e8f0;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* ===== HEADER ===== */
  .cv-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 18px;
    background: linear-gradient(90deg, #0d0d18 0%, #111128 100%);
    border-bottom: 1px solid #1e2040;
    gap: 10px;
    flex-wrap: wrap;
    position: relative;
    z-index: 10;
    flex-shrink: 0;
  }
  .cv-logo {
    font-size: 16px;
    font-weight: 800;
    letter-spacing: -0.5px;
    background: linear-gradient(135deg, #7c6af7, #38bdf8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    white-space: nowrap;
  }
  .cv-controls {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-wrap: wrap;
  }

  /* ===== BUTTONS ===== */
  .cv-btn {
    border: none;
    cursor: pointer;
    font-family: 'Syne', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.4px;
    padding: 6px 12px;
    border-radius: 6px;
    transition: all 0.14s;
    outline: none;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .cv-btn-primary { background: linear-gradient(135deg, #7c6af7, #5b4de3); color: #fff; box-shadow: 0 2px 10px rgba(124,106,247,0.35); }
  .cv-btn-primary:hover { background: linear-gradient(135deg, #8f7ef9, #6b5df5); transform: translateY(-1px); }
  .cv-btn-primary:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
  .cv-btn-secondary { background: rgba(255,255,255,0.06); color: #a0aec0; border: 1px solid rgba(255,255,255,0.1); }
  .cv-btn-secondary:hover { background: rgba(255,255,255,0.1); color: #e2e8f0; }
  .cv-btn-secondary:disabled { opacity: 0.3; cursor: not-allowed; }
  .cv-btn-danger { background: rgba(239,68,68,0.12); color: #fc8181; border: 1px solid rgba(239,68,68,0.25); }
  .cv-btn-danger:hover { background: rgba(239,68,68,0.22); }
  .cv-btn-play { background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; box-shadow: 0 2px 10px rgba(34,197,94,0.28); min-width: 72px; }
  .cv-btn-play:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(34,197,94,0.38); }
  .cv-btn-play:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
  .cv-btn-pause { background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; box-shadow: 0 2px 10px rgba(245,158,11,0.28); min-width: 72px; }
  .cv-btn-pause:hover { transform: translateY(-1px); }
  .cv-btn-toggle { border: 1px solid rgba(255,255,255,0.12); color: #718096; background: rgba(255,255,255,0.04); font-size: 10px; padding: 5px 10px; }
  .cv-btn-toggle.active { background: rgba(56,189,248,0.15); border-color: rgba(56,189,248,0.4); color: #38bdf8; }

  /* ===== SPEED CTRL ===== */
  .cv-speed-ctrl {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 7px;
    padding: 5px 10px;
  }
  .cv-speed-label { font-size: 10px; color: #718096; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }
  .cv-speed-val { font-size: 11px; font-weight: 700; color: #7c6af7; min-width: 35px; text-align: right; }
  .cv-step-badge { font-size: 10px; color: #718096; font-weight: 600; white-space: nowrap; }

  input[type=range].cv-slider {
    -webkit-appearance: none; appearance: none;
    height: 4px; background: rgba(255,255,255,0.1);
    border-radius: 4px; outline: none; cursor: pointer;
  }
  input[type=range].cv-slider-speed { width: 86px; }
  input[type=range].cv-slider-timeline { width: 100%; }
  input[type=range].cv-slider::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none;
    width: 13px; height: 13px; border-radius: 50%;
    background: #7c6af7; cursor: pointer;
    box-shadow: 0 0 6px rgba(124,106,247,0.6);
    transition: box-shadow 0.14s;
  }
  input[type=range].cv-slider::-webkit-slider-thumb:hover { box-shadow: 0 0 10px rgba(124,106,247,0.9); }
  input[type=range].cv-slider-timeline::-webkit-slider-thumb { background: #38bdf8; box-shadow: 0 0 6px rgba(56,189,248,0.5); }
  input[type=range].cv-slider-timeline::-webkit-slider-thumb:hover { box-shadow: 0 0 10px rgba(56,189,248,0.85); }

  /* ===== MAIN BODY GRID ===== */
  .cv-body {
    display: grid;
    grid-template-columns: 1fr 310px;
    grid-template-rows: 1fr 42px 195px;
    flex: 1;
    overflow: hidden;
    height: calc(100vh - 52px);
  }

  /* ===== EDITOR AREA ===== */
  .cv-editor-area {
    grid-column: 1;
    grid-row: 1 / 3;
    display: flex;
    flex-direction: column;
    border-right: 1px solid #1e2040;
    overflow: hidden;
  }
  .cv-editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 7px 14px;
    background: #0d0d18;
    border-bottom: 1px solid #1e2040;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #4a5568;
    flex-shrink: 0;
    min-height: 34px;
    flex-wrap: wrap;
    gap: 6px;
  }
  .cv-editor-wrap { flex: 1; overflow: hidden; position: relative; }

  /* ===== TIMELINE STRIP ===== */
  .cv-timeline {
    grid-column: 1;
    grid-row: 2;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 14px;
    background: #0c0c1a;
    border-top: 1px solid #1a1a2e;
    border-right: 1px solid #1e2040;
    flex-shrink: 0;
  }
  .cv-timeline-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #4a5568; white-space: nowrap; flex-shrink: 0; }
  .cv-timeline-wrap { flex: 1; display: flex; align-items: center; position: relative; }
  .cv-timeline-info { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #38bdf8; white-space: nowrap; flex-shrink: 0; min-width: 72px; text-align: right; }

  /* ===== RIGHT PANELS ===== */
  .cv-panels {
    grid-column: 2;
    grid-row: 1 / 3;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #0a0a0f;
  }
  .cv-panel { border-bottom: 1px solid #1e2040; display: flex; flex-direction: column; overflow: hidden; }
  .cv-panel:last-child { border-bottom: none; }
  .cv-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 12px;
    background: #0d0d18;
    border-bottom: 1px solid #1a1a2e;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #4a5568;
    flex-shrink: 0;
  }
  .cv-panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 8px 11px;
    scrollbar-width: thin;
    scrollbar-color: #2d3748 transparent;
  }

  /* ===== BOTTOM ROW ===== */
  .cv-bottom {
    grid-column: 1 / 3;
    grid-row: 3;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    border-top: 1px solid #1e2040;
    overflow: hidden;
  }
  .cv-explanation { border-right: 1px solid #1e2040; display: flex; flex-direction: column; overflow: hidden; }
  .cv-explanation-text {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #a0aec0;
    padding: 10px 14px;
    flex: 1;
    overflow-y: auto;
    line-height: 1.65;
  }
  .cv-output { border-right: 1px solid #1e2040; display: flex; flex-direction: column; overflow: hidden; }
  .cv-output-content {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #68d391;
    padding: 10px 14px;
    flex: 1;
    overflow-y: auto;
    line-height: 1.7;
    white-space: pre-wrap;
  }
  .cv-output-line { animation: fadeIn 0.3s ease; }

  /* ===== VARIABLE HISTORY ===== */
  .cv-varhistory { display: flex; flex-direction: column; overflow: hidden; }
  .cv-varhistory-content { flex: 1; overflow-y: auto; padding: 7px 11px; }
  .cv-vh-filter {
    display: flex;
    gap: 4px;
    padding: 5px 10px;
    flex-wrap: wrap;
    border-bottom: 1px solid #1a1a2e;
    flex-shrink: 0;
  }
  .cv-vh-filter-btn {
    border: none;
    border-radius: 3px;
    padding: 2px 7px;
    font-size: 9px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.12s;
    font-family: 'Syne', sans-serif;
  }
  .cv-vh-item {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 3px 6px;
    border-radius: 4px;
    margin-bottom: 2px;
    transition: all 0.22s;
    border-left: 2px solid transparent;
  }
  .cv-vh-item.current-step { background: rgba(124,106,247,0.12); border-left-color: #7c6af7; }
  .cv-vh-item.past-step { opacity: 0.5; }
  .cv-vh-name { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #68d391; min-width: 44px; flex-shrink: 0; }
  .cv-vh-arrow { font-size: 8px; color: #4a5568; }
  .cv-vh-prev { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #718096; text-decoration: line-through; }
  .cv-vh-val { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #fbd38d; font-weight: 700; }
  .cv-vh-step { font-size: 9px; color: #4a5568; margin-left: auto; flex-shrink: 0; }

  /* ===== STACK FRAMES ===== */
  .cv-frame {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 7px;
    padding: 7px 10px;
    margin-bottom: 6px;
    transition: all 0.28s cubic-bezier(0.34,1.56,0.64,1);
    transform-origin: top center;
  }
  .cv-frame.active { background: rgba(124,106,247,0.1); border-color: rgba(124,106,247,0.4); box-shadow: 0 0 14px rgba(124,106,247,0.1); }
  .cv-frame-title { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; color: #7c6af7; margin-bottom: 5px; }
  .cv-frame.active .cv-frame-title { color: #a78bfa; }
  .cv-var-row { display: flex; align-items: center; justify-content: space-between; padding: 2px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
  .cv-var-row:last-child { border-bottom: none; }
  .cv-var-name { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #68d391; }
  .cv-var-val { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #fbd38d; transition: all 0.28s; }
  .cv-var-val.updated { color: #f6ad55; text-shadow: 0 0 7px rgba(246,173,85,0.75); }

  /* ===== HEAP ===== */
  .cv-heap-placeholder { font-size: 10px; color: #4a5568; font-style: italic; text-align: center; padding: 10px; border: 1px dashed #2d3748; border-radius: 7px; }

  .cv-heap-object {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 7px;
    padding: 7px 10px;
    margin-bottom: 7px;
    animation: fadeIn 0.3s ease;
    transition: border-color 0.25s;
  }
  .cv-heap-object.updated {
    border-color: rgba(246,173,85,0.5);
    box-shadow: 0 0 10px rgba(246,173,85,0.1);
  }
  .cv-heap-object-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 7px;
  }
  .cv-heap-varname {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    color: #a78bfa;
  }
  .cv-heap-type-badge {
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    padding: 1px 5px;
    border-radius: 3px;
  }
  .cv-heap-type-list { background: rgba(56,189,248,0.15); color: #38bdf8; }
  .cv-heap-type-dict { background: rgba(167,139,250,0.15); color: #a78bfa; }
  .cv-heap-type-tuple { background: rgba(104,211,145,0.15); color: #68d391; }
  .cv-heap-len { margin-left: auto; font-size: 9px; color: #4a5568; font-family: 'JetBrains Mono', monospace; }

  /* List: horizontal cell row */
  .cv-heap-list-row {
    display: flex;
    gap: 3px;
    flex-wrap: wrap;
    align-items: flex-end;
  }
  .cv-heap-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 28px;
  }
  .cv-heap-cell-idx {
    font-size: 8px;
    color: #4a5568;
    font-family: 'JetBrains Mono', monospace;
    margin-bottom: 2px;
  }
  .cv-heap-cell-val {
    background: rgba(56,189,248,0.1);
    border: 1px solid rgba(56,189,248,0.22);
    border-radius: 3px;
    padding: 2px 5px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #38bdf8;
    min-width: 28px;
    text-align: center;
    transition: background 0.25s, border-color 0.25s;
  }

  /* Dict: key→value rows */
  .cv-heap-dict-row {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 2px 0;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .cv-heap-dict-row:last-child { border-bottom: none; }
  .cv-heap-dict-key {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #a78bfa;
    min-width: 40px;
  }
  .cv-heap-dict-colon { font-size: 9px; color: #4a5568; }
  .cv-heap-dict-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #fbd38d;
  }

  /* Tuple */
  .cv-heap-tuple-row {
    display: flex;
    gap: 3px;
    flex-wrap: wrap;
    align-items: center;
  }
  .cv-heap-tuple-cell {
    background: rgba(104,211,145,0.08);
    border: 1px solid rgba(104,211,145,0.2);
    border-radius: 3px;
    padding: 2px 6px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #68d391;
  }
  .cv-heap-empty { font-size: 9px; color: #4a5568; font-style: italic; }

  /* ===== CALL STACK ===== */
  .cv-callstack-item {
    display: flex; align-items: center; gap: 6px;
    padding: 5px 8px; border-radius: 5px; margin-bottom: 3px;
    background: rgba(255,255,255,0.03);
    border-left: 2px solid transparent;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px; color: #a0aec0;
    transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
    animation: slideIn 0.28s cubic-bezier(0.34,1.56,0.64,1);
  }
  .cv-callstack-item.top { border-left-color: #7c6af7; background: rgba(124,106,247,0.1); color: #e2e8f0; }
  .cv-callstack-dot { width: 5px; height: 5px; border-radius: 50%; background: #4a5568; flex-shrink: 0; }
  .cv-callstack-item.top .cv-callstack-dot { background: #7c6af7; box-shadow: 0 0 5px #7c6af7; }

  /* ===== LOOP ===== */
  .cv-loop-info { background: rgba(56,189,248,0.07); border: 1px solid rgba(56,189,248,0.18); border-radius: 7px; padding: 8px 10px; margin-top: 7px; }
  .cv-loop-title { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #38bdf8; letter-spacing: 1px; margin-bottom: 5px; }
  .cv-loop-bar-bg { height: 5px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden; margin-bottom: 4px; }
  .cv-loop-bar-fill { height: 100%; background: linear-gradient(90deg, #38bdf8, #7c6af7); border-radius: 3px; transition: width 0.35s cubic-bezier(0.34,1.56,0.64,1); }
  .cv-loop-stat { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #718096; }

  /* ===== BADGES ===== */
  .cv-badge { background: rgba(124,106,247,0.18); color: #a78bfa; border-radius: 3px; padding: 1px 5px; font-size: 9px; font-weight: 700; }
  .cv-badge-green { background: rgba(34,197,94,0.15); color: #68d391; border-radius: 3px; padding: 1px 5px; font-size: 9px; font-weight: 700; }
  .cv-badge-blue { background: rgba(56,189,248,0.15); color: #38bdf8; border-radius: 3px; padding: 1px 5px; font-size: 9px; font-weight: 700; }
  .cv-badge-red { background: rgba(239,68,68,0.15); color: #fc8181; border-radius: 3px; padding: 1px 5px; font-size: 9px; font-weight: 700; }
  .cv-badge-amber { background: rgba(245,158,11,0.15); color: #fbd38d; border-radius: 3px; padding: 1px 5px; font-size: 9px; font-weight: 700; }

  /* ===== STATUS DOT ===== */
  .cv-status-dot { width: 7px; height: 7px; border-radius: 50%; background: #4a5568; display: inline-block; flex-shrink: 0; }
  .cv-status-dot.running { background: #22c55e; box-shadow: 0 0 6px #22c55e; animation: pulse 1s infinite; }
  .cv-status-dot.paused { background: #f59e0b; }
  .cv-status-dot.done { background: #7c6af7; }

  /* ===== ERROR PANEL ===== */
  .cv-error-panel {
    margin: 10px 12px;
    background: rgba(239,68,68,0.09);
    border: 1px solid rgba(239,68,68,0.32);
    border-radius: 8px;
    padding: 12px 14px;
    animation: fadeIn 0.3s ease;
    flex-shrink: 0;
  }
  .cv-error-title { font-size: 11px; font-weight: 700; color: #fc8181; margin-bottom: 7px; display: flex; align-items: center; gap: 6px; }
  .cv-error-msg { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #feb2b2; line-height: 1.55; white-space: pre-wrap; }
  .cv-error-hint { margin-top: 7px; font-size: 10px; color: #718096; }

  /* ===== BREAKPOINT TAGS ===== */
  .cv-bp-list { display: flex; flex-wrap: wrap; gap: 4px; }
  .cv-bp-tag {
    background: rgba(239,68,68,0.13);
    border: 1px solid rgba(239,68,68,0.28);
    color: #fc8181;
    border-radius: 3px;
    padding: 1px 6px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    cursor: pointer;
    transition: all 0.12s;
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }
  .cv-bp-tag:hover { background: rgba(239,68,68,0.22); }

  /* ===== BEGINNER BANNER ===== */
  .cv-beginner-banner {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 3px 12px;
    background: rgba(56,189,248,0.07);
    border-bottom: 1px solid rgba(56,189,248,0.13);
    font-size: 9px;
    font-weight: 700;
    color: #38bdf8;
    text-transform: uppercase;
    letter-spacing: 0.7px;
    flex-shrink: 0;
  }

  /* ===== BREAKPOINT HIT NOTICE ===== */
  .cv-bp-hit {
    margin: 8px 0 0 0;
    padding: 5px 9px;
    background: rgba(239,68,68,0.09);
    border: 1px solid rgba(239,68,68,0.28);
    border-radius: 5px;
    font-size: 10px;
    color: #fc8181;
    display: flex;
    align-items: center;
    gap: 5px;
    animation: fadeIn 0.25s ease;
  }

  .cv-no-steps { display: flex; align-items: center; justify-content: center; height: 100%; color: #4a5568; font-size: 10px; font-style: italic; text-align: center; padding: 12px; }

  @keyframes slideIn { from { opacity: 0; transform: translateY(-7px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
  @keyframes fadeIn { from { opacity: 0; transform: translateX(-4px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
`;

// ============================================================
// SAMPLE CODE
// ============================================================
const SAMPLE_CODE = `def fact(n):
    if n == 1:
        return 1
    return n * fact(n-1)

result = fact(4)
print(result)

nums = [1, 2, 3, 4, 5]
scores = {"alice": 90, "bob": 75}

total = 0
for i in range(1, 6):
    total += i

print(total)
`;

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function CodeVisualizer() {
  // ---- Refs ----
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);
  const bpDecorationsRef = useRef([]);
  const containerRef = useRef(null);
  const playTimerRef = useRef(null);
  const varHistoryScrollRef = useRef(null);
  const styleInjectedRef = useRef(false);

  // ---- Core execution state ----
  const [editorReady, setEditorReady] = useState(false);
  const [code, setCode] = useState(SAMPLE_CODE);
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(100); // percentage
  const [output, setOutput] = useState([]);
  const [prevVars, setPrevVars] = useState({});
  const [updatedVars, setUpdatedVars] = useState({});
  const [loopInfo, setLoopInfo] = useState(null);
  const [callStack, setCallStack] = useState([]);
  const [stackFrames, setStackFrames] = useState([]);

  // ---- NEW FEATURE state ----
  const [breakpoints, setBreakpoints] = useState(new Set()); // Set<lineNum 0-indexed>
  const [beginnerMode, setBeginnerMode] = useState(false); // Beginner mode toggle
  const [buildError, setBuildError] = useState(null); // { message, hint } | null
  const [varHistory, setVarHistory] = useState({}); // { varName: [{step,value,prevValue,line}] }
  const [activeVarFilter, setActiveVarFilter] = useState(null); // Filter var history by name
  const [heapObjects, setHeapObjects] = useState([]); // Live heap: lists, dicts, tuples from scope

  // ---- Inject styles once (using ref to avoid double injection) ----
  useEffect(() => {
    if (styleInjectedRef.current) return;
    styleInjectedRef.current = true;
    const el = document.createElement("style");
    el.textContent = STYLES;
    document.head.appendChild(el);
    // Monaco active-line + breakpoint glyph styles
    const s2 = document.createElement("style");
    s2.id = "cv-monaco-extras";
    s2.textContent = `
      .cv-active-line { background: rgba(124,106,247,0.16) !important; }
      .cv-bp-glyph { color: #ef4444 !important; font-size: 15px !important; margin-left: 3px; cursor: pointer; }
      .cv-bp-glyph::before { content: "●"; }
    `;
    document.head.appendChild(s2);
  }, []);

  // ---- Init Monaco editor ----
  useEffect(() => {
    loadMonaco(() => {
      if (!containerRef.current || editorRef.current) return;
      const editor = window.monaco.editor.create(containerRef.current, {
        value: SAMPLE_CODE,
        language: "python",
        theme: "vs-dark",
        fontSize: 13,
        fontFamily: "'JetBrains Mono', monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        lineNumbers: "on",
        glyphMargin: true,
        folding: false,
        lineDecorationsWidth: 6,
        renderLineHighlight: "none",
        overviewRulerBorder: false,
        overviewRulerLanes: 0,
        padding: { top: 10 },
        automaticLayout: true,
      });
      editorRef.current = editor;
      monacoRef.current = window.monaco;

      editor.onDidChangeModelContent(() => {
        setCode(editor.getValue());
      });

      // ---- BREAKPOINT: toggle on gutter click ----
      editor.onMouseDown((e) => {
        const m = monacoRef.current;
        const isGutter =
          e.target.type === m.editor.MouseTargetType.GUTTER_GLYPH_MARGIN ||
          e.target.type === m.editor.MouseTargetType.GUTTER_LINE_NUMBERS ||
          e.target.type === m.editor.MouseTargetType.GUTTER_LINE_DECORATIONS;
        if (isGutter && e.target.position) {
          const lineNum = e.target.position.lineNumber - 1; // 0-indexed
          setBreakpoints((prev) => {
            const next = new Set(prev);
            if (next.has(lineNum)) next.delete(lineNum);
            else next.add(lineNum);
            return next;
          });
        }
      });

      setEditorReady(true);
    });
    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, []);

  // ---- Sync breakpoint glyph decorations to Monaco ----
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !editorReady) return;
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    const bpDecs = [...breakpoints].map((ln) => ({
      range: new monaco.Range(ln + 1, 1, ln + 1, 1),
      options: {
        isWholeLine: false,
        glyphMarginClassName: "cv-bp-glyph",
        glyphMarginHoverMessage: {
          value: "**Breakpoint** — click gutter to remove",
        },
        overviewRuler: {
          color: "#ef4444",
          position: monaco.editor.OverviewRulerLane.Left,
        },
      },
    }));
    bpDecorationsRef.current = editor.deltaDecorations(
      bpDecorationsRef.current || [],
      bpDecs,
    );
  }, [breakpoints, editorReady]);

  // ---- Highlight executing line in Monaco ----
  const highlightLine = useCallback((lineNum) => {
    if (!editorRef.current || !monacoRef.current) return;
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    if (lineNum >= 0) {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
        {
          range: new monaco.Range(lineNum + 1, 1, lineNum + 1, 9999),
          options: {
            isWholeLine: true,
            className: "cv-active-line",
            overviewRuler: {
              color: "#7c6af7",
              position: monaco.editor.OverviewRulerLane.Full,
            },
          },
        },
      ]);
      editor.revealLineInCenterIfOutsideViewport(lineNum + 1);
    } else {
      decorationsRef.current = editor.deltaDecorations(
        decorationsRef.current,
        [],
      );
    }
  }, []);

  // ---- BUILD: parse code into steps ----
  const handleBuild = useCallback(() => {
    const src = editorRef.current ? editorRef.current.getValue() : code;
    setBuildError(null);
    try {
      const newSteps = generateSteps(src);
      if (newSteps.length === 0) {
        setBuildError({
          message: "No executable statements found in the provided code.",
          hint: "Make sure your code has at least one assignment, print(), or function call at the top level.",
        });
        return;
      }
      const history = buildVarHistory(newSteps);
      setSteps(newSteps);
      setVarHistory(history);
      setCurrentStep(-1);
      setOutput([]);
      setPrevVars({});
      setUpdatedVars({});
      setLoopInfo(null);
      setCallStack([]);
      setStackFrames([]);
      setActiveVarFilter(null);
      highlightLine(-1);
      setIsPlaying(false);
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    } catch (err) {
      setBuildError({
        message: err.message || String(err),
        hint: "Check for syntax errors: mismatched parentheses, bad indentation, or unsupported Python syntax.",
      });
      setSteps([]);
      setVarHistory({});
    }
  }, [code, highlightLine]);

  // ---- Apply step (core logic — used by step fwd, replay, timeline) ----
  const applyStepData = useCallback(
    (idx, stepsArr, prevOutput, prevScopeVars) => {
      if (idx < 0 || idx >= stepsArr.length) return;
      const step = stepsArr[idx];
      let newOut = [...prevOutput];
      if (step.output !== null) newOut = [...newOut, step.output];

      const newUpdated = {};
      const scopeVars = step.scope || {};
      for (const k of Object.keys(scopeVars)) {
        if (prevScopeVars[k] !== scopeVars[k]) newUpdated[k] = true;
      }
      setUpdatedVars(newUpdated);
      setTimeout(() => setUpdatedVars({}), 480);

      highlightLine(step.line);
      setLoopInfo(step.loopInfo || null);
      setCallStack(step.callStack || []);
      setStackFrames(step.stackFrames || []);
      setPrevVars(scopeVars);
      setOutput(newOut);
      // ---- Update live heap objects ----
      setHeapObjects(extractHeapObjects(scopeVars));
    },
    [highlightLine],
  );

  // ---- Step forward ----
  const stepForward = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev + 1 >= steps.length) return prev;
      const next = prev + 1;
      applyStepData(next, steps, output, prevVars);
      return next;
    });
  }, [steps, output, prevVars, applyStepData]);

  // ---- Step backward (full replay to target - 1) ----
  const stepBack = useCallback(() => {
    if (currentStep <= 0) {
      setCurrentStep(-1);
      setOutput([]);
      setPrevVars({});
      setLoopInfo(null);
      setCallStack([]);
      setStackFrames([]);
      setHeapObjects([]);
      highlightLine(-1);
      return;
    }
    const target = currentStep - 1;
    const { outAcc, scopeAcc, loopInfoAcc, callStackAcc, stackFramesAcc } =
      replayToStep(steps, target);
    highlightLine(steps[target].line);
    setLoopInfo(loopInfoAcc);
    setCallStack(callStackAcc);
    setStackFrames(stackFramesAcc);
    setOutput(outAcc);
    setPrevVars(scopeAcc);
    setHeapObjects(extractHeapObjects(scopeAcc));
    setCurrentStep(target);
  }, [currentStep, steps, highlightLine]);

  // ---- Timeline jump (drag slider to arbitrary step) ----
  const jumpToStep = useCallback(
    (targetIdx) => {
      if (!steps.length) return;
      setIsPlaying(false);
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
      if (targetIdx < 0) {
        setCurrentStep(-1);
        setOutput([]);
        setPrevVars({});
        setLoopInfo(null);
        setCallStack([]);
        setStackFrames([]);
        setHeapObjects([]);
        highlightLine(-1);
        return;
      }
      const safeIdx = Math.min(targetIdx, steps.length - 1);
      const { outAcc, scopeAcc, loopInfoAcc, callStackAcc, stackFramesAcc } =
        replayToStep(steps, safeIdx);
      highlightLine(steps[safeIdx].line);
      setLoopInfo(loopInfoAcc);
      setCallStack(callStackAcc);
      setStackFrames(stackFramesAcc);
      setOutput(outAcc);
      setPrevVars(scopeAcc);
      setHeapObjects(extractHeapObjects(scopeAcc));
      setCurrentStep(safeIdx);
    },
    [steps, highlightLine],
  );

  // ---- Reset ----
  const handleReset = useCallback(() => {
    setCurrentStep(-1);
    setOutput([]);
    setPrevVars({});
    setUpdatedVars({});
    setLoopInfo(null);
    setCallStack([]);
    setStackFrames([]);
    setHeapObjects([]);
    highlightLine(-1);
    setIsPlaying(false);
    if (playTimerRef.current) clearTimeout(playTimerRef.current);
  }, [highlightLine]);

  // ---- Auto-play engine with BREAKPOINT support ----
  useEffect(() => {
    if (!isPlaying) {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
      return;
    }
    if (currentStep >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }

    const baseMs = 1000;
    const multiplier = speed / 100; // 50% → 0.5x, 100% → 1x, 200% → 2x
    const delay = Math.max(80, baseMs / multiplier);

    playTimerRef.current = setTimeout(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next >= steps.length) {
          setIsPlaying(false);
          return prev;
        }

        // Check breakpoint on the NEXT step's line
        const nextStep = steps[next];
        applyStepData(next, steps, output, prevVars);

        if (breakpoints.has(nextStep.line)) {
          // Hit breakpoint — pause immediately after applying
          setIsPlaying(false);
        }

        return next;
      });
    }, delay);

    return () => clearTimeout(playTimerRef.current);
  }, [
    isPlaying,
    currentStep,
    steps,
    speed,
    output,
    prevVars,
    applyStepData,
    breakpoints,
  ]);

  // ---- Scroll var history so current step is visible ----
  useEffect(() => {
    if (!varHistoryScrollRef.current) return;
    const el = varHistoryScrollRef.current.querySelector(
      ".cv-vh-item.current-step",
    );
    if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [currentStep]);

  // ---- Derived values ----
  const isDone = currentStep >= steps.length - 1 && steps.length > 0;
  const hasSteps = steps.length > 0;
  const currentStepData =
    currentStep >= 0 && currentStep < steps.length ? steps[currentStep] : null;
  const timelineMax = Math.max(0, steps.length - 1);

  // Flat var history for panel, sorted by step
  const flatVarHistory = useMemo(() => {
    const all = [];
    for (const [varName, entries] of Object.entries(varHistory)) {
      entries.forEach((e) => all.push({ ...e, varName }));
    }
    all.sort((a, b) => a.step - b.step);
    return activeVarFilter
      ? all.filter((e) => e.varName === activeVarFilter)
      : all;
  }, [varHistory, activeVarFilter]);

  const allVarNames = useMemo(() => Object.keys(varHistory), [varHistory]);

  // ---- Render helpers ----
  const renderStackFrames = () => {
    if (!stackFrames || stackFrames.length === 0) {
      return <div className="cv-no-steps">No stack frames yet</div>;
    }
    return [...stackFrames].reverse().map((frame, i) => (
      <div key={i} className={`cv-frame${frame.active ? " active" : ""}`}>
        <div className="cv-frame-title">
          {frame.active ? "▶ " : ""}
          {frame.name}
        </div>
        {Object.keys(frame.vars)
          .filter((k) => k !== "__return")
          .map((k) => {
            const v = frame.vars[k];
            let display;
            if (v && typeof v === "object") {
              if (v.__list)
                display = `[${v.items.map((x) => JSON.stringify(x)).join(", ")}]`;
              else if (v.__dict)
                display = `{${v.entries.map((e) => `${JSON.stringify(e.key)}: ${JSON.stringify(e.value)}`).join(", ")}}`;
              else if (v.__tuple)
                display = `(${v.items.map((x) => JSON.stringify(x)).join(", ")})`;
              else display = JSON.stringify(v);
            } else {
              display = JSON.stringify(v);
            }
            return (
              <div key={k} className="cv-var-row">
                <span className="cv-var-name">{k}</span>
                <span
                  className={`cv-var-val${updatedVars[k] ? " updated" : ""}`}
                >
                  {display}
                </span>
              </div>
            );
          })}
        {Object.keys(frame.vars).filter((k) => k !== "__return").length ===
          0 && (
          <div style={{ fontSize: 9, color: "#4a5568", fontStyle: "italic" }}>
            empty frame
          </div>
        )}
      </div>
    ));
  };

  const renderCallStack = () => {
    const mainItem = (
      <div className="cv-callstack-item">
        <div
          className="cv-callstack-dot"
          style={{ background: "#22c55e", boxShadow: "0 0 5px #22c55e" }}
        />
        main
      </div>
    );
    if (!callStack || callStack.length === 0) {
      return <div style={{ paddingTop: 4 }}>{mainItem}</div>;
    }
    return (
      <div>
        {[...callStack].reverse().map((cs, i) => (
          <div key={i} className={`cv-callstack-item${i === 0 ? " top" : ""}`}>
            <div className="cv-callstack-dot" />
            {cs}
          </div>
        ))}
        {mainItem}
      </div>
    );
  };

  // ---- Render live Heap objects (lists, dicts, tuples) ----
  const renderHeap = () => {
    if (!heapObjects || heapObjects.length === 0) {
      return (
        <div className="cv-heap-placeholder">
          No heap objects yet.
          <br />
          Assign a <span style={{ color: "#38bdf8" }}>list</span>,{" "}
          <span style={{ color: "#a78bfa" }}>dict</span>, or{" "}
          <span style={{ color: "#68d391" }}>tuple</span> to see it here.
        </div>
      );
    }
    return heapObjects.map((obj, oi) => {
      const isUpdated = updatedVars[obj.name];
      return (
        <div
          key={oi}
          className={`cv-heap-object${isUpdated ? " updated" : ""}`}
        >
          <div className="cv-heap-object-header">
            <span className="cv-heap-varname">{obj.name}</span>
            <span className={`cv-heap-type-badge cv-heap-type-${obj.type}`}>
              {obj.type}
            </span>
            {obj.type === "list" && (
              <span className="cv-heap-len">
                {obj.data.length} item{obj.data.length !== 1 ? "s" : ""}
              </span>
            )}
            {obj.type === "dict" && (
              <span className="cv-heap-len">
                {obj.data.length} key{obj.data.length !== 1 ? "s" : ""}
              </span>
            )}
            {obj.type === "tuple" && (
              <span className="cv-heap-len">
                {obj.data.length} elem{obj.data.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* List: cells with index labels */}
          {obj.type === "list" &&
            (obj.data.length === 0 ? (
              <div className="cv-heap-empty">[ empty ]</div>
            ) : (
              <div className="cv-heap-list-row">
                {obj.data.map((item, idx) => (
                  <div key={idx} className="cv-heap-cell">
                    <div className="cv-heap-cell-idx">[{idx}]</div>
                    <div className="cv-heap-cell-val">
                      {item === null
                        ? "None"
                        : typeof item === "object"
                          ? JSON.stringify(item)
                          : String(item)}
                    </div>
                  </div>
                ))}
              </div>
            ))}

          {/* Dict: key → value rows */}
          {obj.type === "dict" &&
            (obj.data.length === 0 ? (
              <div className="cv-heap-empty">{} empty</div>
            ) : (
              obj.data.map((entry, ei) => (
                <div key={ei} className="cv-heap-dict-row">
                  <span className="cv-heap-dict-key">
                    {entry.key === null ? "None" : JSON.stringify(entry.key)}
                  </span>
                  <span className="cv-heap-dict-colon">:</span>
                  <span className="cv-heap-dict-val">
                    {entry.value === null
                      ? "None"
                      : typeof entry.value === "object"
                        ? JSON.stringify(entry.value)
                        : String(entry.value)}
                  </span>
                </div>
              ))
            ))}

          {/* Tuple: compact pill cells */}
          {obj.type === "tuple" &&
            (obj.data.length === 0 ? (
              <div className="cv-heap-empty">( ) empty</div>
            ) : (
              <div className="cv-heap-tuple-row">
                <span style={{ color: "#4a5568", fontSize: 10 }}>(</span>
                {obj.data.map((item, idx) => (
                  <span key={idx} className="cv-heap-tuple-cell">
                    {item === null ? "None" : String(item)}
                  </span>
                ))}
                <span style={{ color: "#4a5568", fontSize: 10 }}>)</span>
              </div>
            ))}
        </div>
      );
    });
  };

  const renderVarHistory = () => {
    if (flatVarHistory.length === 0) {
      return <div className="cv-no-steps">No variable changes yet</div>;
    }
    return flatVarHistory.map((entry, i) => {
      const isCurrentEntry = entry.step === currentStep;
      const isPast = entry.step < currentStep;
      const isFuture = entry.step > currentStep;
      return (
        <div
          key={i}
          className={`cv-vh-item${isCurrentEntry ? " current-step" : ""}${isPast ? " past-step" : ""}`}
          style={{ opacity: isFuture ? 0.22 : undefined }}
        >
          <span className="cv-vh-name">{entry.varName}</span>
          {entry.prevValue !== undefined && (
            <>
              <span className="cv-vh-prev">
                {JSON.stringify(entry.prevValue)}
              </span>
              <span className="cv-vh-arrow">→</span>
            </>
          )}
          <span className="cv-vh-val">{JSON.stringify(entry.value)}</span>
          <span className="cv-vh-step">#{entry.step + 1}</span>
        </div>
      );
    });
  };

  const getExplanation = () => {
    if (!currentStepData) return null;
    if (beginnerMode && currentStepData.explanationBeginner)
      return currentStepData.explanationBeginner;
    return currentStepData.explanation;
  };

  const stepTypeBadgeClass = (type) => {
    const map = {
      assign: "cv-badge",
      print: "cv-badge-green",
      call: "cv-badge",
      return: "cv-badge-amber",
      return_complete: "cv-badge-amber",
      condition: "cv-badge-blue",
      loopstart: "cv-badge-blue",
      loopiter: "cv-badge-blue",
      loopdone: "cv-badge-green",
      funcdef: "cv-badge",
      exec: "cv-badge",
    };
    return map[type] || "cv-badge";
  };

  const statusClass = isPlaying
    ? "running"
    : isDone
      ? "done"
      : currentStep >= 0
        ? "paused"
        : "";
  const statusText = isPlaying
    ? "Running"
    : isDone
      ? "Done"
      : currentStep >= 0
        ? "Paused"
        : "Ready";
  const bpHit =
    !isPlaying && currentStepData && breakpoints.has(currentStepData.line);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="cv-root">
      {/* ======================================================
          HEADER — Controls
      ====================================================== */}
      <div className="cv-header">
        <div className="cv-logo">⚡ CodeVisualizer</div>

        <div className="cv-controls">
          <button className="cv-btn cv-btn-secondary" onClick={handleBuild}>
            ▶ Build
          </button>

          {!isPlaying ? (
            <button
              className="cv-btn cv-btn-play"
              onClick={() => {
                if (!hasSteps) handleBuild();
                setIsPlaying(true);
              }}
              disabled={isDone}
            >
              ▶ Play
            </button>
          ) : (
            <button
              className="cv-btn cv-btn-pause"
              onClick={() => setIsPlaying(false)}
            >
              ⏸ Pause
            </button>
          )}

          <button
            className="cv-btn cv-btn-primary"
            onClick={stepBack}
            disabled={!hasSteps || currentStep < 0}
          >
            ← Back
          </button>
          <button
            className="cv-btn cv-btn-primary"
            onClick={stepForward}
            disabled={!hasSteps || isDone}
          >
            Step →
          </button>
          <button className="cv-btn cv-btn-danger" onClick={handleReset}>
            ↺ Reset
          </button>

          {/* Speed slider */}
          <div className="cv-speed-ctrl">
            <span className="cv-speed-label">Speed</span>
            <input
              type="range"
              className="cv-slider cv-slider-speed"
              min={50}
              max={300}
              step={10}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            />
            <span className="cv-speed-val">{speed}%</span>
          </div>

          {/* Beginner Mode Toggle */}
          <button
            className={`cv-btn cv-btn-toggle${beginnerMode ? " active" : ""}`}
            onClick={() => setBeginnerMode((v) => !v)}
            title="Toggle beginner-friendly explanations"
          >
            {beginnerMode ? "🎓 Beginner" : "⚙ Technical"}
          </button>

          {/* Status indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span className={`cv-status-dot ${statusClass}`} />
            <span className="cv-step-badge">
              {statusText}
              {hasSteps &&
                currentStep >= 0 &&
                ` · ${currentStep + 1}/${steps.length}`}
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================
          BODY GRID
      ====================================================== */}
      <div className="cv-body">
        {/* ---- EDITOR AREA ---- */}
        <div className="cv-editor-area">
          <div className="cv-editor-header">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <span>Editor · Python</span>
              {/* Breakpoint tags */}
              {breakpoints.size > 0 && (
                <div className="cv-bp-list">
                  {[...breakpoints]
                    .sort((a, b) => a - b)
                    .map((bp) => (
                      <span
                        key={bp}
                        className="cv-bp-tag"
                        onClick={() =>
                          setBreakpoints((prev) => {
                            const n = new Set(prev);
                            n.delete(bp);
                            return n;
                          })
                        }
                        title="Click to remove breakpoint"
                      >
                        ● L{bp + 1} ×
                      </span>
                    ))}
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              {currentStepData && (
                <span className={stepTypeBadgeClass(currentStepData.type)}>
                  {currentStepData.type}
                </span>
              )}
              {currentStepData && (
                <span className="cv-badge-blue">
                  L{currentStepData.line + 1}
                </span>
              )}
              {bpHit && <span className="cv-badge-red">⬤ BP</span>}
            </div>
          </div>

          {/* Syntax / Build Error Panel */}
          {buildError && (
            <div className="cv-error-panel">
              <div className="cv-error-title">
                ⚠ Parse Error — Cannot build steps
              </div>
              <div className="cv-error-msg">{buildError.message}</div>
              {buildError.hint && (
                <div className="cv-error-hint">💡 {buildError.hint}</div>
              )}
            </div>
          )}

          <div className="cv-editor-wrap">
            <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
          </div>
        </div>

        {/* ---- TIMELINE STRIP ---- */}
        <div className="cv-timeline">
          <span className="cv-timeline-label">Timeline</span>
          <div className="cv-timeline-wrap">
            <input
              type="range"
              className="cv-slider cv-slider-timeline"
              min={0}
              max={timelineMax || 1}
              step={1}
              value={currentStep < 0 ? 0 : currentStep}
              disabled={!hasSteps}
              onChange={(e) => jumpToStep(Number(e.target.value))}
            />
          </div>
          <span className="cv-timeline-info">
            {hasSteps && currentStep >= 0
              ? `Step ${currentStep + 1} / ${steps.length}`
              : `— / ${steps.length || 0}`}
          </span>
        </div>

        {/* ---- RIGHT PANELS: Stack, Heap, Call Stack ---- */}
        <div className="cv-panels">
          {/* Stack Variables */}
          <div
            className="cv-panel"
            style={{ flex: "0 0 auto", maxHeight: "37%" }}
          >
            <div className="cv-panel-header">
              <span>Stack</span>
              <span className="cv-badge">
                {stackFrames.length} frame{stackFrames.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="cv-panel-content">
              {hasSteps && currentStep >= 0 ? (
                renderStackFrames()
              ) : (
                <div className="cv-no-steps">Build & step to see variables</div>
              )}
            </div>
          </div>

          {/* Heap — live objects (lists, dicts, tuples) */}
          <div
            className="cv-panel"
            style={{ flex: "0 0 auto", maxHeight: "30%", minHeight: "60px" }}
          >
            <div className="cv-panel-header">
              <span>Heap</span>
              <span
                className={
                  heapObjects.length > 0 ? "cv-badge-blue" : "cv-badge"
                }
              >
                {heapObjects.length} object{heapObjects.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="cv-panel-content">{renderHeap()}</div>
          </div>

          {/* Call Stack + Loop progress */}
          <div className="cv-panel" style={{ flex: "1", minHeight: "0" }}>
            <div className="cv-panel-header">
              <span>Call Stack</span>
              <span className="cv-badge">
                {callStack.length + 1} frame{callStack.length !== 0 ? "s" : ""}
              </span>
            </div>
            <div className="cv-panel-content">
              {renderCallStack()}
              {loopInfo && (
                <div className="cv-loop-info">
                  <div className="cv-loop-title">Loop · {loopInfo.var}</div>
                  <div className="cv-loop-bar-bg">
                    <div
                      className="cv-loop-bar-fill"
                      style={{
                        width: `${loopInfo.total > 0 ? (loopInfo.current / loopInfo.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <div className="cv-loop-stat">
                    {loopInfo.current}/{loopInfo.total} iterations
                    {loopInfo.done ? " ✓" : ""}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ---- BOTTOM ROW: Explanation · Output · Var History ---- */}
        <div className="cv-bottom">
          {/* Explanation panel */}
          <div className="cv-explanation">
            <div className="cv-panel-header">
              <span>Explanation</span>
              <div style={{ display: "flex", gap: 4 }}>
                {beginnerMode && <span className="cv-badge-blue">🎓</span>}
                {currentStepData && (
                  <span className={stepTypeBadgeClass(currentStepData.type)}>
                    {currentStepData.type}
                  </span>
                )}
              </div>
            </div>
            {beginnerMode && (
              <div className="cv-beginner-banner">
                <span>🎓</span> Beginner mode active — simple language
              </div>
            )}
            <div className="cv-explanation-text">
              {getExplanation() ? (
                <span>{getExplanation()}</span>
              ) : (
                <span style={{ color: "#4a5568" }}>
                  {hasSteps
                    ? "Press Step → or Play to start"
                    : "Press Build to generate steps"}
                </span>
              )}
              {/* Breakpoint hit notice */}
              {bpHit && (
                <div className="cv-bp-hit">
                  ● Breakpoint hit on line {currentStepData.line + 1} —
                  execution paused
                </div>
              )}
            </div>
          </div>

          {/* Output Console */}
          <div className="cv-output">
            <div className="cv-panel-header">
              <span>Output Console</span>
              <span className="cv-badge-green">
                {output.length} line{output.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="cv-output-content">
              {output.length === 0 ? (
                <span style={{ color: "#4a5568" }}>No output yet…</span>
              ) : (
                output.map((line, i) => (
                  <div key={i} className="cv-output-line">
                    <span style={{ color: "#4a5568", marginRight: 7 }}>
                      [{i + 1}]
                    </span>
                    {line}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Variable History panel */}
          <div className="cv-varhistory">
            <div className="cv-panel-header">
              <span>Var History</span>
              <span className="cv-badge">
                {flatVarHistory.length} change
                {flatVarHistory.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Filter by variable name */}
            {allVarNames.length > 0 && (
              <div className="cv-vh-filter">
                <button
                  className="cv-vh-filter-btn"
                  onClick={() => setActiveVarFilter(null)}
                  style={{
                    background:
                      activeVarFilter === null
                        ? "rgba(124,106,247,0.25)"
                        : "rgba(255,255,255,0.05)",
                    color: activeVarFilter === null ? "#a78bfa" : "#718096",
                    fontFamily: "'Syne', sans-serif",
                  }}
                >
                  ALL
                </button>
                {allVarNames.map((v) => (
                  <button
                    key={v}
                    className="cv-vh-filter-btn"
                    onClick={() =>
                      setActiveVarFilter((prev) => (prev === v ? null : v))
                    }
                    style={{
                      background:
                        activeVarFilter === v
                          ? "rgba(104,211,145,0.2)"
                          : "rgba(255,255,255,0.05)",
                      color: activeVarFilter === v ? "#68d391" : "#718096",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}

            <div className="cv-varhistory-content" ref={varHistoryScrollRef}>
              {renderVarHistory()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
