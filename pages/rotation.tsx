import dynamic from "next/dynamic";

// Import the component with SSR disabled
const RotationPage = dynamic(
  () => import("../components/RotationPage"),
  { ssr: false }
);

export default RotationPage;