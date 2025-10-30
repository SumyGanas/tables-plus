import { Badge } from "@/components/ui/badge"
import { CircleX } from "lucide-react"
import { useState } from "react";
import { Button } from "@/components/ui/button"



interface Props {
  prop: string;
}

export const Badges = ({prop}:Props)=> {
  const [isVisible, setIsVisible] = useState(true);
  const handleDelete= () => {
    setIsVisible(false);
  }
  if (!isVisible) {
    return null;
  }
  return (

          <Badge variant="secondary" > 
          {prop}
          <div onClick={handleDelete} id="delete-enum-div" ><CircleX id="delete-enum-svg" color="red" size={12}/></div>
          </Badge>


  );
}
