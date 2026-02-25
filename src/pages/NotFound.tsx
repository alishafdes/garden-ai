import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sprout } from "lucide-react";

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-background px-4">
    <div className="text-center">
      <Sprout className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
      <h1 className="text-4xl font-serif font-bold mb-2">404</h1>
      <p className="text-muted-foreground mb-6">This garden path doesn't exist.</p>
      <Link to="/">
        <Button>Return Home</Button>
      </Link>
    </div>
  </div>
);

export default NotFound;
