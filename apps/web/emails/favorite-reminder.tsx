// apps/web/emails/favorite-reminder.tsx
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

interface FavoriteReminderEmailProps {
  userEmail: string;
  userName: string;
  favoritePlaces: { name: string; slug: string; neighborhood: string }[];
  appUrl: string;
}

export const FavoriteReminderEmail = ({
  userEmail,
  userName,
  favoritePlaces,
  appUrl,
}: FavoriteReminderEmailProps) => {
  const previewText = `📌 Retrouvez vos ${favoritePlaces.length} lieux préférés sur Quivibe !`;

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

          <Heading style={h1}>📌 Vos lieux préférés vous attendent !</Heading>

          <Text style={paragraph}>Bonjour {userName},</Text>

          <Text style={paragraph}>
            Vous avez {favoritePlaces.length} établissements dans vos favoris.
            Voici un petit rappel :
          </Text>

          <Section style={placesSection}>
            {favoritePlaces.map((place, index) => (
              <Section key={index} style={placeItem}>
                <Text style={placeName}>{place.name}</Text>
                <Text style={placeInfo}>📍 {place.neighborhood}</Text>
                <Button
                  style={placeButton}
                  href={`${appUrl}/places/${place.slug}`}
                >
                  Voir les détails
                </Button>
              </Section>
            ))}
          </Section>

          <Section style={buttonSection}>
            <Button style={button} href={`${appUrl}/favorites`}>
              Voir tous mes favoris
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Cet email a été envoyé à {userEmail}. Vous pouvez vous désinscrire
            à tout moment.
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

const placesSection = {
  margin: "20px 0",
};

const placeItem = {
  padding: "16px",
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
  marginBottom: "12px",
};

const placeName = {
  fontSize: "16px",
  fontWeight: "bold",
  color: "#1a1a1a",
  margin: "0 0 4px",
};

const placeInfo = {
  fontSize: "14px",
  color: "#666666",
  margin: "0 0 8px",
};

const placeButton = {
  backgroundColor: "#f97316",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "14px",
  padding: "8px 20px",
  textDecoration: "none",
  display: "inline-block",
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

export default FavoriteReminderEmail;
