// apps/web/emails/owner-request-status.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface OwnerRequestStatusEmailProps {
  userEmail: string;
  userName: string;
  placeName: string;
  status: "APPROVED" | "REJECTED";
  adminNote?: string;
  appUrl: string;
}

export const OwnerRequestStatusEmail = ({
  userEmail,
  userName,
  placeName,
  status,
  adminNote,
  appUrl,
}: OwnerRequestStatusEmailProps) => {
  const isApproved = status === "APPROVED";
  const previewText = isApproved
    ? `✅ Votre demande pour ${placeName} a été approuvée !`
    : `❌ Votre demande pour ${placeName} a été refusée`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img
              src={`${appUrl}/images/logo.png`}
              width="150"
              height="auto"
              alt="Quivibe"
              style={logo}
            />
          </Section>

          <Heading style={h1}>
            {isApproved ? "✅ Demande approuvée !" : "❌ Demande refusée"}
          </Heading>

          <Text style={paragraph}>Bonjour {userName},</Text>

          <Text style={paragraph}>
            {isApproved ? (
              <>
                Nous avons le plaisir de vous annoncer que votre demande pour{" "}
                <strong>{placeName}</strong> a été approuvée !
              </>
            ) : (
              <>
                Nous sommes au regret de vous informer que votre demande pour{" "}
                <strong>{placeName}</strong> a été refusée.
              </>
            )}
          </Text>

          {isApproved ? (
            <Text style={paragraph}>
              Vous pouvez maintenant accéder à votre espace propriétaire pour
              gérer votre établissement, publier des événements et interagir
              avec vos clients.
            </Text>
          ) : (
            <Text style={paragraph}>
              Vous pouvez soumettre une nouvelle demande en vous assurant que
              toutes les informations sont correctes et complètes.
            </Text>
          )}

          {adminNote && (
            <Section style={noteSection}>
              <Text style={noteLabel}>Note de l'administrateur :</Text>
              <Text style={noteContent}>{adminNote}</Text>
            </Section>
          )}

          <Section style={buttonSection}>
            <Button
              style={button}
              href={
                isApproved
                  ? `${appUrl}/owner/dashboard`
                  : `${appUrl}/owner/request`
              }
            >
              {isApproved
                ? "Accéder à mon espace"
                : "Faire une nouvelle demande"}
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Cet email a été envoyé à {userEmail}. Si vous avez des questions,
            contactez-nous.
          </Text>

          <Text style={footer}>
            © {new Date().getFullYear()} Quivibe. Tous droits réservés.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: "Arial, sans-serif",
  padding: "20px 0",
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #f0f0f0",
  borderRadius: "8px",
  margin: "0 auto",
  maxWidth: "600px",
  padding: "40px 30px",
};

const logoSection = {
  textAlign: "center" as const,
  padding: "10px 0",
};

const logo = {
  margin: "0 auto",
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "30px 0 20px",
  textAlign: "center" as const,
};

const paragraph = {
  color: "#555555",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 0",
};

const noteSection = {
  margin: "20px 0",
  padding: "16px",
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
  borderLeft: "4px solid #f97316",
};

const noteLabel = {
  fontSize: "14px",
  fontWeight: "bold",
  color: "#1a1a1a",
  margin: "0 0 8px",
};

const noteContent = {
  fontSize: "14px",
  color: "#555555",
  margin: "0",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "30px 0",
};

const button = {
  backgroundColor: "#f97316",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  padding: "14px 40px",
  textDecoration: "none",
  display: "inline-block",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "30px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "24px",
  textAlign: "center" as const,
  margin: "10px 0",
};

export default OwnerRequestStatusEmail;
