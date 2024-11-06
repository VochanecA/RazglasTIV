// menuData.ts

export type MenuItem = {
    id: number;
    title: string;
    path: string;
    newTab: boolean;
  };
  
  export const menuData: MenuItem[] = [
    {
      id: 1,
      title: "Pricing",
      path: "/pricing",
      newTab: false,
    },
    {
      id: 2,
      title: "About",
      path: "/about",
      newTab: false,
    },
    {
      id: 3,
      title: "Contact",
      path: "/contact",
      newTab: false,
    },
    {
        id: 4,
        title: "Info",
        path: "/info",
        newTab: false,
      },
      {
        id: 5,
        title: "Flight",
        path: "/flights",
        newTab: false,
      },
  ];
  