"use client"

// import Box from '@mui/material/Box';
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import Script from "next/script";
import { useResponsive } from "src/hooks/use-responsive";

import {
  Grid,
  Box,
  Typography,
  Button,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
} from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import Typed from "typed.js";
import gsap from "gsap";
import { Iconify } from "src/components/iconify";

// ----------------------------------------------------------------------

declare global {
  interface Window {
    VANTA: any;
  }
}

type Props = {
  title?: string;
  image?: string;
  children: React.ReactNode;
};
export default function AuthSplitLayout({ children, image, title }: Props) {

  const mdUp = useResponsive("up", "md");


  const featureLogoPath = "/assets/icons/pre-auth-features/";

  const featureJsonFirstRow = [
    {
      title: "Total Coverage",
      logo: "/assets/icons/pre-auth-features/total_coverage.svg",
    },
    {
      title: "Perfect Uptime",
      logo: "/assets/icons/pre-auth-features/ic_track_live_location.svg",
    },
    {
      title: "Rapid Processing",
      logo: "/assets/icons/pre-auth-features/rapid_processing.svg",
    },
    {
      title: "Business-Ready",
      logo: "/assets/icons/pre-auth-features/rapid_processing.svg",
    },
    {
      title: "Flexi Pay-as-you-Go pricing",
      logo: "/assets/icons/pre-auth-features/rapid_processing.svg",
    },
    {
      title: "Rapid Processing",
      logo: "/assets/icons/pre-auth-features/ic_track_live_location.svg",
    },
  ];
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try{
      const loadVanta = () => {
        const threeScript = document.createElement("script");
        threeScript.src =
          "https://cdnjs.cloudflare.com/ajax/libs/three.js/r121/three.min.js";
        threeScript.onload = () => {
          const vantaScript = document.createElement("script");
          vantaScript.src =
            "https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.globe.min.js";
          vantaScript.onload = () => {
            if (myRef.current) {
              window.VANTA.GLOBE({
                el: myRef.current,
                mouseControls: true,
                touchControls: true,
                gyroControls: false,
                minHeight: 200.0,
                minWidth: 200.0,
                scale: 1.0,
                scaleMobile: 1.0,
                color: 0xa49586,
                showLines: false,
                backgroundAlpha: 0,
                backgroundImage:
                  "linear-gradient(132.21deg, #0A080E 42.76%, #250E44 60.02%),linear-gradient(180deg, rgba(9, 8, 13, 0.2) 0%, rgba(31, 11, 53, 0.2) 39.38%)",
              });
            }
          };
          document.body.appendChild(vantaScript);
        };
        document.body.appendChild(threeScript);
      };
      if (isMounted) {
        loadVanta();
      }
    }
    // Dynamically load the Vanta and Three.js scripts
   

   catch(e){
    console.log("webgl not supported")
   }

    return () => {
      try{
        if (myRef.current && typeof window.VANTA !== "undefined") {
          window.VANTA.GLOBE({ el: myRef.current }).destroy();
        }
      }
      catch(e){
        console.log("webgl not supported")
      }
      
    };
  }, [isMounted]);
  const renderLogo = (
    <img
      src="/logo/logo-full.svg"
      style={{
        zIndex: 9,
        height: "50px",
        position: "absolute",
        // margin: { xs: 2, md: 7 },
        margin: "30px",
      }}
    />
  );

  const renderContent = (
    <Stack
      sx={{
        width: 1,
        mx: "auto",
        px: { xs: 2, md: 5 },
        pt: { xs: 5, md: 5 },
        pb: { xs: 5, md: 0 },
      }}
      justifyContent={"center"}
      alignItems={"center"}
    >
      <Box maxWidth={"80%"} minWidth={"80%"}>
        {children}
      </Box>
    </Stack>
  );

  const myRef = useRef(null);

  const renderSection = (
    <>
      <Stack
        flexGrow={1}
        spacing={3}
        alignItems="left"
        justifyContent="top"
        sx={{
          backgroundImage:
            "linear-gradient(132.21deg, #0A080E 42.76%, #000c42 60.02%),linear-gradient(180deg, rgba(9, 8, 13, 0.2) 0%, rgba(31, 11, 53, 0.2) 39.38%)",
          backgroundSize: "cover",
          paddingTop: "150px",

          px: { xs: 2, md: 8 },
          minWidth: "60%",
          position: "relative",
          maxHeight: "100vh",
        }}
        id="vanta_animation"
      >
        <div
          ref={myRef}
          style={{
            height: "100%",
            width: "100%",
            position: "absolute",
            top: "0px",
            bottom: "0px",
            left: "0px",
            right: "0px",
            zIndex: 0,
            backgroundImage: "transparent",
          }}
        ></div>
        {/* <div className="box">
          <span></span>
          <span></span>
          <span></span>
        </div> */}
        <Box
          sx={{
            height: "100%",
            width: "100%",
            zIndex: 5,
            overflowY: "auto",
            "&::-webkit-scrollbar": {
              width: "0em",
            },
          }}
        >
          <HeroSection />
          {/* <CardInfo />
          <CardInfo />
          <CardInfo />
          <CardInfo /> */}
        </Box>
      </Stack>
    </>
  );
  return (
    <>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js" />
      <Script src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.clouds.min.js" />
      <Stack
        component="main"
        direction="row"
        sx={{
          minHeight: "100vh",
        }}
      >
        {renderLogo}

        {mdUp && renderSection}

        {renderContent}
      </Stack>
    </>
  );
}

const HeroSection = () => {
  const el = useRef(null);

  useEffect(() => {
    if (el.current) {
      let typed = new Typed(el.current, {
        strings: [
          "scattered AI vendors",
          "multiple model keys",
          "fragile RAG pipelines",
          "manual OCR flows",
          "ad-hoc embeddings scripts",
          "unclear AI usage & costs",
        ],
        typeSpeed: 50,
        loop: true,
        showCursor: false,
      });
      return () => {
        typed.destroy();
      };
    }
  }, []);

  return (
    <Stack
      flexGrow={1}
      spacing={3}
      alignItems="left"
      justifyContent="top"
      sx={{
        height: "100%",
      }}
    >
      <Typography
        variant="h4"
        sx={{
          color: "white",
          zIndex: 9,
          fontWeight: 700,
          position: "relative",
          mb: 0,
        }}
      >
        We Turn{" "}
        <span style={{ color: "#088DEE" }}>AI Chaos</span> Into{" "}
        <span style={{ color: "#088DEE" }}>One Gateway</span>
      </Typography>

      <Typography variant="h3" color="white">
        Stop wasting time on
      </Typography>

      <Typography
        variant="h1"
        color="#088DEE"
        ref={el}
        sx={{
          minHeight: "150px",
          letterSpacing: "0px",
        }}
      >
        {/* Typed.js fills this */}
      </Typography>
    </Stack>
  );
};


const CalendlyInvite = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setSuccess(false);
    setName("");
    setEmail("");
    setMessage("");
  };

  const handleSubmit = async (e:any) => {
  //   e.preventDefault();

  //   // Calendly payload
  //   const payload = {
  //     email,
  //     name,
  //     custom_answers: {
  //       1: message, // Custom question mapping
  //     },
  //   };

  //   try {
  //     const calendlyEventLink = "https://calendly.com/your-account/15min";

  //     // Replace <EVENT_ID> with the actual event ID
  //     const response = await fetch(
  //       `https://api.calendly.com/scheduled_events/<EVENT_ID>/invitees`,
  //       {
  //         method: "POST",
  //         headers: {
  //           Authorization: `Bearer YOUR_PERSONAL_ACCESS_TOKEN`,
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify(payload),
  //       }
  //     );

  //     if (!response.ok) {
  //       throw new Error(`HTTP error! Status: ${response.status}`);
  //     }

  //     const data = await response.json();
  //     console.log("Calendly Response: ", data);
  //     setSuccess(true);
  //   } catch (error) {
  //     console.error("Error scheduling Calendly event: ", error);
  //   }
  };

  return (
    <>
      <a href="https://calendly.com/nixon-peter-shiprocket/30min" target="_blank">
        <Button
          variant="contained"
          color="primary"
          sx={{
            background: "white",
            borderRadius: "25px",
            padding: 2,
            px: 4,
            color: "black",
            position: "static",
            "&:hover": {
              background: "white",
            },
          }}
        >
          Book A Demo
        </Button>
      </a>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Schedule a Meeting</DialogTitle>
        <DialogContent>
          {success ? (
            <Typography variant="h6" color="success.main" sx={{ my: 3 }}>
              Meeting successfully scheduled! Please check your email.
            </Typography>
          ) : (
            <form onSubmit={handleSubmit}>
              <TextField
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                required
                margin="normal"
              />
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                required
                margin="normal"
              />
              <TextField
                label="Message (Optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                fullWidth
                multiline
                rows={4}
                margin="normal"
              />
              <DialogActions sx={{ justifyContent: "flex-end" }}>
                <Button onClick={handleClose} color="secondary">
                  Cancel
                </Button>
                <Button type="submit" variant="contained" color="primary">
                  Schedule
                </Button>
              </DialogActions>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

const CardInfo = () => {
  return (
    <Stack
      sx={{
        mt: 2,
        minHeight: "100%",
      }}
      flexGrow={1}
      spacing={3}
      alignItems="left"
      justifyContent="top"
    >
      <Typography
        variant="h2"
        color={"#088DEE"}
        sx={{
          display: "flex",
          alignItems: "center",
        }}
      >
        1 AI Gateway
        <Iconify icon="solar:arrow-right-down-broken" width="24" height="24" />
      </Typography>

      <Typography color="white" variant="h1">
        for all your{" "}
        <span
          style={{
            color: "#088DEE",
          }}
        >
          AI services
        </span>
      </Typography>

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-start",
          flexDirection: "row",
        }}
      >
        <Stack
          direction={"row"}
          sx={{
            position: "relative",
            justifyContent: "center",
            mt: 2,
          }}
        >
          <Box
            sx={{
              maxWidth: "100%",
              backgroundImage:
                "linear-gradient(to right, #F3EAFF 0%, 24.77763593196869%, #DAFCF2 49.55527186393738%, 74.77763593196869%, #E9E9FF 100%);",
              borderRadius: "20px",
              p: 2,
            }}
          >
            <Stack
              sx={{
                height: "100%",
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="h4">
                Route OCR, embeddings, summarization, chat & RAG
                through a single, secure AI gateway.
              </Typography>
            </Stack>
          </Box>

          <img
            src="https://sr-website.shiprocket.in/wp-content/uploads/2024/04/ib-1.webp"
            height={300}
            style={{
              marginLeft: "-50px",
              marginTop: "30px",
            }}
          />
        </Stack>
      </Box>
    </Stack>
  );
};
