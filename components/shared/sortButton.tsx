import React from "react";
import { Button } from "../ui/button";
import { ArrowDown, ArrowUp } from "lucide-react";
interface sortbaleButtonProps {
  onClick: () => void;
  isAsc: boolean;
}

function SortButton({ onClick, isAsc }: sortbaleButtonProps) {
  console.log(isAsc);
  return (
    <Button variant="ghost" onClick={onClick}>
      Name
      {isAsc ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />}
    </Button>
  );
}

export default SortButton;
