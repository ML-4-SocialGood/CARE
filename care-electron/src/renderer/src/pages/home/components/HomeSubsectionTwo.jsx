/** @format */

import HomeSubsection from './HomeSubsection'
import { Heading } from '../../../components/Heading'
import { Image } from './Image'
import stoat from '@renderer/assets/red-stoat.png'
import kiwi from '@renderer/assets/kiwi.png'

export default function HomeSubsectionTwo() {
  return (
    <HomeSubsection className="homeSubsection homeSubsection2" id="whycare">
      <div className="subsection__images">
        <Image
          shape="rectangle"
          alt="Stoat perked up on grass"
          imageSrc={stoat}
          className="stoat-image"
        ></Image>
        <Image
          shape="rectangle"
          alt="Kiwi in the bush"
          imageSrc={kiwi}
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
          CARE (Clip-based Animal RE-identification) is an advanced, AI-driven web toolkit designed
          to enhance wildlife conservation efforts by enabling precise, scalable animal
          re-identification. We hope to make this technology available to the wider community,
          empowering researchers, conservationists, and enthusiasts alike to identify and track
          animals effortlessly, advancing wildlife conservation and ecological research.
        </p>
      </div>
    </HomeSubsection>
  )
}
