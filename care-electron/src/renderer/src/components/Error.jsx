/** @format */

import React from "react";

import "./error.css";
import { Heading } from "./Heading";
import {Button} from "./Button";
import Bird from "../assets/bird.png";

export default function Error() {


  return (
    <section className="error">

      
            <div className="error__container">
                
                <Heading className="errorHeading" level={2}>Oops! We couldn’t find the page you were looking for.</Heading>
                <Heading level={5}>
                                Double check the url and try again.
                </Heading>
                <div className="birdImg"><img  src= {Bird} /></div>
                 <a href="/"><Button className="back__button" variant="primary" >
                Back to home
                 </Button></a>

                 
                 
            </div>
    

    </section>
    
  );
}