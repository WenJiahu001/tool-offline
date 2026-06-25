interface Token {
  type: 'sql' | 'single-comment' | 'multi-comment' | 'semicolon';
  value: string;
}

export function tokenizeSql(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const len = input.length;
  let currentSql = '';

  const flushSql = () => {
    if (currentSql) {
      tokens.push({ type: 'sql', value: currentSql });
      currentSql = '';
    }
  };

  while (i < len) {
    const char = input[i];
    const nextChar = i + 1 < len ? input[i + 1] : '';

    // 1. 处理多行注释 /* ... */
    if (char === '/' && nextChar === '*') {
      flushSql();
      let commentContent = '/*';
      i += 2;
      while (i < len) {
        if (input[i] === '*' && i + 1 < len && input[i + 1] === '/') {
          commentContent += '*/';
          i += 2;
          break;
        }
        commentContent += input[i];
        i++;
      }
      tokens.push({ type: 'multi-comment', value: commentContent });
      continue;
    }

    // 2. 处理单行注释 -- 或 #
    if ((char === '-' && nextChar === '-') || char === '#') {
      flushSql();
      let commentContent = char === '#' ? '#' : '--';
      i += char === '#' ? 1 : 2;
      while (i < len && input[i] !== '\n' && input[i] !== '\r') {
        commentContent += input[i];
        i++;
      }
      tokens.push({ type: 'single-comment', value: commentContent });
      continue;
    }

    // 3. 处理分号 ;
    if (char === ';') {
      flushSql();
      tokens.push({ type: 'semicolon', value: ';' });
      i++;
      continue;
    }

    // 4. 处理字符串字面量，防止字符串里的分号/注释被误判
    if (char === "'" || char === '"' || char === '`') {
      const quote = char;
      currentSql += quote;
      i++;
      while (i < len) {
        const c = input[i];
        currentSql += c;
        if (c === '\\') {
          // 转义字符，把下一个字符也读进来
          if (i + 1 < len) {
            currentSql += input[i + 1];
            i += 2;
          } else {
            i++;
          }
        } else if (c === quote) {
          i++;
          break;
        } else {
          i++;
        }
      }
      continue;
    }

    // 5. 普通字符
    currentSql += char;
    i++;
  }

  flushSql();
  return tokens;
}

export function minifySql(input: string): string {
  if (!input) return '';
  const tokens = tokenizeSql(input);
  const lines: string[] = [];
  let currentSqlLine = '';

  for (const token of tokens) {
    if (token.type === 'sql') {
      // 将换行 and 连续空白字符替换为单个空格
      const val = token.value.replace(/\s+/g, ' ');
      const trimmedVal = val.trim();
      if (trimmedVal) {
        if (currentSqlLine) {
          currentSqlLine += ' ' + trimmedVal;
        } else {
          currentSqlLine = trimmedVal;
        }
      }
    } else if (token.type === 'semicolon') {
      // 分号直接附加到当前 SQL 行的末尾
      currentSqlLine += ';';
      // 遇到分号，代表当前 SQL 语句结束，推入 lines 并清空
      lines.push(currentSqlLine);
      currentSqlLine = '';
    } else if (token.type === 'single-comment' || token.type === 'multi-comment') {
      // 如果当前 SQL 行有内容，先将其推入 lines
      if (currentSqlLine.trim()) {
        lines.push(currentSqlLine.trim());
        currentSqlLine = '';
      }
      
      // 压缩注释内部的多余空白和换行
      const commentVal = token.value.replace(/\s+/g, ' ').trim();
      if (commentVal) {
        lines.push(commentVal);
      }
    }
  }

  // 循环结束后，如果还有残余的当前行，也推入 lines
  if (currentSqlLine.trim()) {
    lines.push(currentSqlLine.trim());
  }

  // 最后合并成字符串，并过滤掉空行
  return lines.map(line => line.trim()).filter(Boolean).join('\n');
}
