import { Badge } from "@/components/ui/badge"
import { CircleX } from "lucide-react"
import { useState, useEffect } from "react";



interface Props {
  props: Set<string>;
}
export const Badges = ({props}:Props)=> {
  

  const [visibleItems, setIsVisible] = useState<string[]>(Array.from(props));
  
  useEffect(() => {
    setIsVisible(Array.from(props));
  }, [props, props.size]);

  if (!visibleItems.length) {
    return null;
  }
  
  const handleDelete= (item: string) => {
    setIsVisible(prev => prev.filter(i => i !== item));
    props.delete(item)
  }
    return (
          <>
          {visibleItems.map(enumType => (
          <Badge key={enumType} variant="secondary" > 
          {enumType}
          <div onClick={()=>handleDelete(enumType)} id="delete-enum-div" ><CircleX id="delete-enum-svg" color="red" size={12}/></div>
          </Badge>
          ))}
          </>
  );
          }