/** @format */

import HomeSubsection from "./HomeSubsection";
import { Heading } from "../../../components/Heading";
import { Image } from "./Image";
import Jenny from "../../../assets/jenny.png";
import Frank from "../../../assets/frank.png";
import Grace from "../../../assets/grace.png";

export default function HomeSubsectionOne() {
  return (
    <HomeSubsection className="homeSubsection homeSubsection1" id="whoweare">
      <div className="subsection__description">
      <Heading level={2} className="subsection__heading">
          Who We Are
        </Heading>
        <p className="subsection__paragraph">
          Te Korowai o Waiheke is a charitable trust established 
          by the local community to eradicate predators from our beautiful island. 
          The first stage of the Te Korowai o Waiheke project 
          involves island-wide stoat eradication. The second stage consists 
          of a series of operational trials to understand how to remove rats 
          from the entirety of Waiheke.
        </p>

      </div>
      <div className="people">
        <div className="person">
          <Image
            shape="circle"
            alt="Jenny Holmes - Project Director"
            imageSrc={Jenny}
          />
          <div className="person__info">
            <Heading level={4} className="person_info_name">
              Jenny Holmes
            </Heading>
            <p className="person_info_title">Project Director</p>
          </div>
        </div>
        <div className="person">
          <Image
            shape="circle"
            alt="Frank Lepera - Stoat Operations Manager"
            imageSrc={Frank}
          ></Image>
          <div className="person__info">
            <Heading level={4} className="person_info_name">
              Frank Lepera
            </Heading>
            <p className="person_info_title">Stoat Operations Manager</p>
          </div>
        </div>
        <div className="person">
          <Image
            shape="circle"
            alt="Samantha Macpherson - Stoat Lead Field Technician"
            imageSrc={Grace}
          ></Image>
          <div className="person__info">
            <Heading level={4} className="person_info_name">
              Samantha Macpherson
            </Heading>
            <p className="person_info_title">Stoat Lead Field Technician</p>
          </div>
        </div>
      </div>
    </HomeSubsection>
  );
}
