/** @format */

import SignupForm from "./components/SignupForm";
import "../authentication.css";
import { Heading } from "../../../components/Heading";

export default function SignUp() {
  return (
    <section className="signup">
      <div className="signup__form__container">
        <Heading level={2}>Sign Up</Heading>
        <Heading level={5}>
          Please enter your Full Name and Email address.
        </Heading>
        <SignupForm />
      </div>
    </section>
  );
}
