import PageMeta from "../../components/common/PageMeta";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Skill Sigma | Sign In"
        description="This is the Sign In page for Skill Sigma"
      />
      <SignInForm />
    </>
  );
}
