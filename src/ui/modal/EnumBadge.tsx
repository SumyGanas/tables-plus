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
          <span key={enumType} className="tp-badge"> 
            <span>{enumType}</span>
            <span onClick={()=>handleDelete(enumType)} className="tp-badge-delete">&#9447;</span>
          </span>
          ))}
          </>
  );
          }
