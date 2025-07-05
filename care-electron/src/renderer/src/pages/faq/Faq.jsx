/** @format */

import React from "react";
import { Heading } from "../../components/Heading.jsx";
import "./Faq.css";
import AccordionItem from "../../components/AccordionItem.jsx";
import { ImageBanner } from "../../components/ImageBanner.jsx";

export default function Faq() {
  return (
    <section>
      <ImageBanner />
      <div className="heading">
        <Heading level={1}>Help</Heading>
      </div>

      <AccordionItem
        buttonText="Who can use the CARE Web Platform?"
        content={
          <div>
            Currently, only members of Te Korowai o Waiheke can access the website upon request. 
            We apologise for any inconvenience this may cause.
          </div>
        }
      />

      <AccordionItem
        buttonText="How do I sign in to the website?"
        content={
          <div>
            Only members who have been authorised by the admin can sign in.
            <br />
            <br />
            If you have an activated account, follow these steps to sign in:
            <br />
            <ol>
              <li>
                Click on the "Sign In" button located at the top right corner of
                the navigation bar. You will be redirected to the sign-in form.
              </li>
              <li>
                Enter your username and password in the respective fields.
              </li>
              <li>Click the "Submit" button to access your account.</li>
            </ol>
            If you do not have an account, you can register and wait for the admin's approval.
            <br />
            <ol>
              <li>
                Click on the "Sign In" button at the top right corner of the
                navigation bar, then click "Sign Up".
              </li>
              <li>
                Enter your username, email, and password in the respective fields.
              </li>
              <li>Click the "Submit" button to register your account. You can then wait for admin approval.</li>
              <br />
            </ol>
            If problems persist, please contact support directly.
          </div>
        }
      />

      <AccordionItem
        buttonText="Why can’t I sign in?"
        content={
          <div>
            Only approved members can access the site. Ensure that you have contacted the admin 
            and that they have manually added you to the system. If you still cannot sign in, try the following:
            <br />
            <ol>
              <li>
                Double-check that you are entering the correct email address and
                password, and ensure there are no typos.
              </li>
              <br />
              <li>
                Sometimes, browser settings or cache issues can prevent sign-in.
                Try clearing your browser cache or using a different browser.
              </li>
              <br />
              <li>
                There may be temporary technical issues with the website. If you suspect this is the case, please try again later.
              </li>
              <br />
            </ol>
            If problems persist, please contact support directly.
          </div>
        }
      />

      <AccordionItem
        buttonText="How does the AI model identify and re-identify animals?"
        content={
          <div>
            <strong>CARE (Conservation through AI-Driven Animal Re-Identification)</strong> uses a <strong>CLIP-based AI model</strong> to identify individual animals. 
            This model was developed by doctoral students <strong>Di</strong> and <strong>Justin</strong> under the supervision of <strong>Dr Yun Sing</strong>, 
            using images collected by motion-sensor cameras around Waiheke Island, provided by <strong>Te Korowai o Waiheke</strong>.
          </div>
        }
      />
    </section>
  );
}
