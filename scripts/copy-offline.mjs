import {copyFile, stat} from 'node:fs/promises';

const source = new URL('../offline/WebStudio.html', import.meta.url);
const target = new URL('../WebStudio.html', import.meta.url);
if ((await stat(source)).size < 100_000) throw new Error('Офлайн-сборка слишком мала: проверьте встраивание JavaScript и CSS');
await copyFile(source, target);
console.log('Готово: WebStudio.html — откройте файл двойным щелчком без сервера.');
