import { compile } from '@tailwindcss/node';
import { Scanner } from '@tailwindcss/oxide';
import fs from 'node:fs';
import path from 'node:path';

async function build() {
  console.log('Compiling Tailwind CSS for Sharp Academy Portal...');
  const baseCss = `
@import "tailwindcss";

@layer base {
  :root {
    --font-heading: 'Outfit', sans-serif;
    --font-body: 'Inter', sans-serif;
  }
}
`;

  const compiler = await compile(baseCss, {
    base: process.cwd(),
    onDependency: () => {}
  });

  const scanner = new Scanner({
    sources: [
      { base: process.cwd(), pattern: 'src/**/*.{tsx,ts}', negated: false }
    ]
  });

  const candidates = scanner.scan();
  console.log(`Discovered ${candidates.length} candidate classes from src/**/*.{tsx,ts}.`);

  const compiledCss = compiler.build(candidates);

  const dest1 = path.resolve('public/css/tailwind.css');
  const dest2 = path.resolve('src/public/css/tailwind.css');

  fs.mkdirSync(path.dirname(dest1), { recursive: true });
  fs.mkdirSync(path.dirname(dest2), { recursive: true });

  fs.writeFileSync(dest1, compiledCss, 'utf-8');
  fs.writeFileSync(dest2, compiledCss, 'utf-8');

  console.log(`Generated tailwind.css (${(compiledCss.length / 1024).toFixed(1)} KB) successfully!`);
}

build().catch(err => {
  console.error('Build CSS failed:', err);
  process.exit(1);
});
