// Application menu: standard roles so copy/paste and window shortcuts work on mac.
import { Menu } from "electron";

export function installMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [];
  if (process.platform === "darwin") template.push({ role: "appMenu" });
  else template.push({ role: "fileMenu" });
  template.push({ role: "editMenu" }, { role: "viewMenu" }, { role: "windowMenu" });
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
