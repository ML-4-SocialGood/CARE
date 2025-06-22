/** @format */

import SigninForm from "./components/SigninForm";
import "../authentication.css";
import { Heading } from "@renderer/components/Heading";
import { Link } from "react-router-dom";

export default function SignIn() {
  return (
    <section className="signup">
      <div className="signup__form__container">
        <Heading level={2}>Sign In</Heading>
        <Heading level={5}>
          Please enter your username and password.
        </Heading>
        <Heading level={5}>
          No account? <Link to ="/signup">Sign up</Link>
        </Heading>
        <SigninForm />
      </div>
    </section>
  );
}
