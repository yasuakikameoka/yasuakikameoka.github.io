import { spawn } from 'node:child_process';

const build = spawn(process.execPath, ['--env-file-if-exists=.env', 'src/generators/build-all.js'], {
  stdio: 'inherit',
});

build.on('exit', (code, signal) => {
  if (signal) {
    console.error(`Build stopped by signal: ${signal}`);
    process.exit(1);
  }

  if (code !== 0) {
    process.exit(code ?? 1);
  }

  console.log('');
  console.log('ビルドが完了しました。');
  console.log('ローカルで `npm run serve` を実行して表示を確認してください。');
  console.log('問題なければ、内容をレビューしたうえで手動で git add / commit / push してください。');
});
