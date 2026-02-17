import { NavLink } from "react-router-dom";
import { Download, RotateCcw } from "lucide-react";

const PageNavigation = () => {
  return (
    <nav className="relative z-10 flex items-center justify-center gap-6 py-6">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isActive
              ? "bg-primary/20 text-primary border border-primary/30"
              : "text-muted-foreground hover:text-foreground"
          }`
        }
      >
        <Download className="h-4 w-4" />
        Loader
      </NavLink>
      <NavLink
        to="/hwid"
        className={({ isActive }) =>
          `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isActive
              ? "bg-primary/20 text-primary border border-primary/30"
              : "text-muted-foreground hover:text-foreground"
          }`
        }
      >
        <RotateCcw className="h-4 w-4" />
        HWID Reset
      </NavLink>
    </nav>
  );
};

export default PageNavigation;
