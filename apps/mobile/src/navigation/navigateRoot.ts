type NavNode = {
  navigate: (screen: string, screenParams?: object) => void;
  getParent?: () => object | undefined;
  getState?: () => { routeNames?: string[] };
};

export function navigateRoot(navigation: object, name: string, params?: object): void {
  let current: NavNode | undefined = navigation as NavNode;
  while (current) {
    if (current.getState?.()?.routeNames?.includes(name)) {
      current.navigate(name, params);
      return;
    }
    current = current.getParent?.() as NavNode | undefined;
  }
  (navigation as NavNode).navigate(name, params);
}
