import { useEffect, useState } from "react";
import { getLocalStorage, setLocalStorage } from "../utils/localStorage";

const RotationPage = () => {
  const [rotation, setRotation] = useState(null);

  useEffect(() => {
    // Using your utility function instead of direct localStorage access
    const savedRotation = getLocalStorage("rotation", null);
    setRotation(savedRotation);
  }, []);

  const updateRotation = (newRotation: number | null) => {
    setRotation(newRotation as null);
    // Using your utility function to save
    setLocalStorage("rotation", newRotation);
  };

  return (
    <div>
      <div>Last Rotation: {rotation}</div>
      {/* Additional component logic */}
    </div>
  );
};

export default RotationPage;