/** @format */

import React from "react";
import { Heading } from "../../components/Heading.jsx";
import { ImageBanner } from "../../components/ImageBanner.jsx";
import "./about.css";
import stoatImage from "../../assets/stoat_photo.jpg";

export default function About() {
  return (
    <section>
      <ImageBanner />
      <div className="about_container">
        <Heading level={1}>About CARE</Heading>
        <h3 className="header_text">
          CARE is a web-based application designed for conservationists in New Zealand, 
          leveraging AI to identify stoats and reidentify individuals in bulk image uploads.
        </h3>

        <div className="about_content">
          <div>
            <img className="stoat_image" alt="Stoat Image" src={stoatImage} />
          </div>
          <p className="p_one">
            Stoats pose a serious threat to New Zealand's native bird species. 
            Identifying and tracking specific stoat populations is essential for controlling them. 
            By analysing their patterns, scientists can potentially curb their spread. 
            On Waiheke Island, there are currently four known breeding pairs of stoats. 
            Thanks to rapid advancements in AI image classification, 
            we can now track these stoats through a digital interface, 
            streamlining the process compared to the time-consuming manual methods previously used.
          </p>
          <p className="p_class_2">
            CARE collaborates closely with Te Korowai o Waiheke, 
            a nonprofit organisation committed to creating a predator-free Waiheke Island.
          </p>
          <p className="p_class_2">
            Our application allows researchers to bulk upload images from motion-activated camera traps, 
            automatically organising the photos by upload date. 
            Users can browse their uploaded images and select some for analysis using the Detection Model. 
            Once processed, they can view the results and choose images to run through the Re-Identification Model. 
            After this second processing, users can review the ReID results, 
            which categorise the selected images into several groups, 
            significantly reducing the time and resources required for manual verification. 
            Only verified researchers and conservationists can access this platform. 
            Our goal is to provide conservationists, researchers, 
            and organisations with the tools to collect and share data and findings, 
            fostering knowledge sharing and collaboration within the wildlife conservation community.
          </p>
          <p className="p_class_2">
            Doctoral students Di and Justin developed the AI models for the CARE web platform under the guidance of Dr Yun Sing, 
            while the UoA capstone team, “BinaryBuilders,” was responsible for creating the web platform itself.
          </p>
          <br />
          <br />
        </div>
      </div>
    </section>
  );
}