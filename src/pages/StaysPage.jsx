import { useParams } from "react-router-dom";
import StayListing from "../components/Stay/StayListing";

export default function StaysPage() {
  const { city } = useParams();
  return <StayListing  />;
}