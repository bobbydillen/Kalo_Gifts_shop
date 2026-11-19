import { permanentRedirect } from "next/navigation";

/** The wear drop now lives on the T-shirts page. */
export default function WearPage() {
  permanentRedirect("/gifts/t-shirts");
}
