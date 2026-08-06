// apps/web/emails/welcome.tsx
import {
  Body,
  Button,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

interface WelcomeEmailProps {
  userEmail: string;
  userName: string;
  appUrl: string;
}

export const WelcomeEmail = ({
  userEmail,
  userName,
  appUrl,
}: WelcomeEmailProps) => {
  const previewText = `Bienvenue sur Quivibe, ${userName} !`;

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

          <Heading style={h1}>Bienvenue sur Quivibe !</Heading>

          <Text style={paragraph}>Bonjour {userName},</Text>

          <Text style={paragraph}>
            Nous sommes ravis de vous accueillir sur Quivibe, la plateforme qui
            vous aide à découvrir les meilleurs lieux de sortie à Kinshasa.
          </Text>

          <Section style={featuresSection}>
            <Row>
              <Column style={featureColumn}>
                <Text style={featureTitle}>🔍 Découvrir</Text>
                <Text style={featureDescription}>
                  Explorez des centaines d'établissements
                </Text>
              </Column>
              <Column style={featureColumn}>
                <Text style={featureTitle}>❤️ Favoris</Text>
                <Text style={featureDescription}>
                  Sauvegardez vos lieux préférés
                </Text>
              </Column>
            </Row>
            <Row>
              <Column style={featureColumn}>
                <Text style={featureTitle}>⭐ Avis</Text>
                <Text style={featureDescription}>
                  Partagez vos expériences
                </Text>
              </Column>
              <Column style={featureColumn}>
                <Text style={featureTitle}>📅 Événements</Text>
                <Text style={featureDescription}>
                  Restez informé des sorties
                </Text>
              </Column>
            </Row>
          </Section>

          <Section style={buttonSection}>
            <Button style={button} href={appUrl}>
              Découvrir les lieux
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Cet email a été envoyé à {userEmail}. Si vous avez des questions,
            n'hésitez pas à nous contacter.
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
  fontSize: "28px",
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

const featuresSection = {
  margin: "30px 0",
  padding: "20px",
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
};

const featureColumn = {
  padding: "10px",
  textAlign: "center" as const,
};

const featureTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  margin: "10px 0 5px",
  color: "#1a1a1a",
};

const featureDescription = {
  fontSize: "14px",
  color: "#666666",
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

export default WelcomeEmail;
