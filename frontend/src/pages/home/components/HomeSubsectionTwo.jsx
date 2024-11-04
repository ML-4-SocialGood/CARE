/** @format */

import HomeSubsection from "./HomeSubsection";
import { Heading } from "../../../components/Heading";
import { Image } from "./Image";

export default function HomeSubsectionTwo() {
  return (
    <HomeSubsection className="homeSubsection homeSubsection2" id="whycare">
      <div className="subsection__images">
        <Image
          shape="rectangle"
          alt="Stoat perched on a rock"
          imageSrc="https://media.istockphoto.com/id/1200548895/photo/short-tailed-weasel-ermine.jpg?s=612x612&w=0&k=20&c=2V_Lfo2OJJZp9m9VRDyJnDW6zL3stDyb7pMV9R1V5OM="
          className="stoat-image"
        ></Image>
        <Image
          shape="rectangle"
          alt="Kākā on a branch"
          imageSrc="https://images.squarespace-cdn.com/content/v1/5d76ee9f1f264a21c33e4c22/1650521594233-UF77848I0BGDGQPD3GKB/image+%282%29.jpeg"
          className="kaka-image"
        ></Image>
      </div>
      <div className="subsection__description-right">
        <Heading level={6} className="subsection__subheading">
          Utilise the power of AI
        </Heading>
        <Heading level={2} className="subsection__heading">
          Why choose CARE?
        </Heading>
        <p className="subsection__paragraph">
          AI can detect things that the human eye simply cannot. CARE uses a CLIP-based AI model that has been trained to identify stoats at an individual level.
        </p>
      </div>
    </HomeSubsection>
  );
}
