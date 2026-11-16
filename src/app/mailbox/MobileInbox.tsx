"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  IconButton,
  TextField,
  Drawer,
  CircularProgress,
  Button,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  Badge,
  DialogActions,
  Backdrop,
  InputAdornment,
} from "@mui/material";
import axios from "axios";
import imageCompression from "browser-image-compression";
import UserProfileModal from "@/components/UserProfileModal";
import ReplyModal from "./components/ReplyModal";
import CustomDialog from "@/components/CustomDialog";
import {
  Delete,
  ArrowBack,
  AddPhotoAlternate,
  Close,
  Search
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import { jwtDecode } from "jwt-decode";
import AppFooterMobile from "@/layout/AppFooterMobile";
import AppHeaderMobile from "@/layout/AppHeaderMobile";

interface Mail {
  Avatar: string;
  Subject: string;
  ProfileFromUsername: string;
  ProfileToUsername: string;
  ProfileIdFrom: string;
  ProfileTo: string;
  Body: string;
  Image?: string;
  Image_1?: string;
  Image_2?: string;
  Image_3?: string;
  Image_4?: string;
  CreatedAt: string;
}

const useDialogHistory = (open: boolean, onClose: () => void, modalId: string) => {
  const pushedStateRef = React.useRef(false);

  React.useEffect(() => {
    if (typeof window !== "undefined" && !(window as any).__activeModals) {
      (window as any).__activeModals = [];
    }

    if (open && !pushedStateRef.current) {
      window.history.pushState({ dialogOpen: true }, "", window.location.href);
      pushedStateRef.current = true;
      (window as any).__activeModals.push(modalId);
    } else if (!open && pushedStateRef.current) {
      const activeModals = (window as any).__activeModals;
      if (activeModals[activeModals.length - 1] === modalId) {
        (window as any).__ignoreNextPopState = true;
        window.history.back();
        setTimeout(() => {
          (window as any).__ignoreNextPopState = false;
        }, 100);
      }
      pushedStateRef.current = false;
      const index = activeModals.indexOf(modalId);
      if (index > -1) activeModals.splice(index, 1);
    }

    const handlePopState = (event: PopStateEvent) => {
      if ((window as any).__ignoreNextPopState) return;

      const activeModals = (window as any).__activeModals;
      if (open && activeModals[activeModals.length - 1] === modalId) {
        if ((window as any).__popStateHandled === event.timeStamp) return;
        (window as any).__popStateHandled = event.timeStamp;

        pushedStateRef.current = false;
        const index = activeModals.indexOf(modalId);
        if (index > -1) activeModals.splice(index, 1);
        onClose();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [open, onClose, modalId]);
};

const MobileInbox = () => {
  const isMobile = useMediaQuery("(max-width: 480px)") ? true : false;

  const router = useRouter();
  const [myProfile, setMyProfile] = useState<any>({});
  const [newMessage, setNewMessage] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [mailBoxOpen, setMailbox] = useState(false);
  const [profileId, setProfileId] = useState<any>();
  const [chatOpen, setChat] = useState(false);
  const [userProfiles, setUserProfiles] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [inboxSearchQuery, setInboxSearchQuery] = useState("");
  const [sentSearchQuery, setSentSearchQuery] = useState("");
  const [mailSearchQuery, setMailSearchQuery] = useState("");
  const [chatSearchQuery, setChatSearchQuery] = useState("");

  const activeProfileSearch = mailBoxOpen ? mailSearchQuery : chatOpen ? chatSearchQuery : "";
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState(0);
  const [creatingNew, setCreatingNew] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [userDeviceToken, setUserDeviceToken] = useState(null);
  const [membership, setMembership] = useState(0);
  const [messages, setMessages] = useState<any>([]);
  const [chatList, setChatList] = useState([]);

  const [newMail, setNewMail] = useState({
    subject: "",
    message: "",
  });

  const [openModal, setOpenModal] = useState(false);
  const [selectedMail, setSelectedMail] = useState<any>(null);
  const [selectedMailsWithReply, setSelectedMailsWithReply] = useState<Mail[]>(
    [],
  );
  const [uploadedImages, setUploadedImages] = useState<
    Array<{ file: File; preview: string; url?: string }>
  >([]);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState<any>(false);
  const [selectedUserId, setSelectedUserId] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [drawerHeight, setDrawerHeight] = useState("70vh");

  const [premiumDialogOpen, setPremiumDialogOpen] = useState(false);
  const [premiumDialogCancelRoute, setPremiumDialogCancelRoute] = useState("/mailbox");

  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorDialogMessage, setErrorDialogMessage] = useState("");

  useDialogHistory(openModal, () => setOpenModal(false), "mailDetailsModal");
  useDialogHistory(imageModalOpen, () => setImageModalOpen(false), "imageExpandedModal");
  useDialogHistory(mailBoxOpen, () => {
    setMailbox(false);
    setMailSearchQuery("");
  }, "createMailDrawer");
  useDialogHistory(chatOpen, () => {
    setChat(false);
    setChatSearchQuery("");
  }, "chatModalDrawer");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleResize = () => {
      const keyboardOpen = window.innerHeight - viewport.height > 150;

      setDrawerHeight(keyboardOpen ? "100vh" : "70vh");
    };

    viewport.addEventListener("resize", handleResize);

    return () => {
      viewport.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleMailClick = async (chat: any) => {
    const token = localStorage.getItem("loginInfo");

    if (!token) {
      router.push("/login");
      return;
    }

    const decodeToken = jwtDecode<any>(token);

    if (decodeToken?.membership === 0) {
      setPremiumDialogCancelRoute("/messaging");
      setPremiumDialogOpen(true);
      return;
    }

    setSelectedMail({
      Avatar: chat.Avatar,
      ProfileFromId: chat.ProfileIdFrom,
      ProfileToId: chat.ProfileTo,
      id: chat.MessageId,
      from: chat.ProfileFromUsername,
      to: chat.ProfileToUsername,
      subject: chat.Subject,
      content: chat.Body,
      image: chat.Image || null,
      image1: chat.Image_1 || null,
      image2: chat.Image_2 || null,
      image3: chat.Image_3 || null,
      image4: chat.Image_4 || null,
    });

    setOpenModal(true);

    try {
      const result = await fetch(
        `/api/user/mailbox/reply?chatid=${chat.MessageId}`,
      );
      const mails = await result.json();
      setSelectedMailsWithReply(mails.data);
    } catch (error) {
      console.error("Failed to fetch mail replies:", error);
      setErrorDialogMessage("Unable to load mail replies.");
      setErrorDialogOpen(true);
    }
  };

  const handleMailDesktopClick = async (chat: any) => {
    const token = localStorage.getItem("loginInfo");

    if (!token) {
      router.push("/login");
      return;
    }

    const decodeToken = jwtDecode<any>(token);

    if (decodeToken?.membership === 0) {
      setPremiumDialogCancelRoute("/messaging");
      setPremiumDialogOpen(true);
      return;
    }

    setSelectedMail({
      Avatar: chat.Avatar,
      ProfileFromId: chat.ProfileIdFrom,
      ProfileToId: chat.ProfileTo,
      id: chat.MessageId,
      from: chat.ProfileFromUsername,
      to: chat.ProfileToUsername,
      subject: chat.Subject,
      content: chat.Body,
      image: chat.Image || null,
      image1: chat.Image_1 || null,
      image2: chat.Image_2 || null,
      image3: chat.Image_3 || null,
      image4: chat.Image_4 || null,
    });

    try {
      const result = await fetch(
        `/api/user/mailbox/reply?chatid=${chat.MessageId}`,
      );
      const mails = await result.json();
      setSelectedMailsWithReply(mails.data);
    } catch (error) {
      console.error("Failed to fetch mail replies:", error);
      setErrorDialogMessage("Unable to load mail replies.");
      setErrorDialogOpen(true);
    }
  };

  const getMyProfile = async (userId: string) => {
    if (userId) {
      try {
        const response = await fetch(`/api/user/sweeping/user?id=${userId}`);
        if (!response.ok) {
          console.error(
            "Failed to fetch advertiser data:",
            response.statusText,
          );
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const { user: userData } = await response.json();
        if (!userData) {
          console.error("Advertiser not found");
        } else {
          setMyProfile(userData);
        }
      } catch (error: any) {
        console.error("Error fetching data:", error.message);
      }
    }
  };

  const handleCloseMailBox = () => {
    const token = localStorage.getItem("loginInfo");

    if (token) {
      const decodeToken = jwtDecode<any>(token);
      if (decodeToken?.membership == 0) {
        setPremiumDialogCancelRoute("/mailbox");
        setPremiumDialogOpen(true);
      } else {
        setMailbox(!mailBoxOpen);
        setMailSearchQuery("");
      }
    } else {
      router.push("/login");
    }
  };

  const handleCloseChatBox = () => {
    setChat(!chatOpen);
    setChatSearchQuery("");
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files) return;

    const newImages = Array.from(files).slice(0, 5 - uploadedImages.length);

    const processedImages = await Promise.all(
      newImages.map(async (file) => {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: file.type,
        };

        try {
          const compressedFile = await imageCompression(file, options);
          const processedFile = new File([compressedFile], file.name, {
            type: file.type,
            lastModified: new Date().getTime(),
          });

          return {
            file: processedFile,
            preview: URL.createObjectURL(processedFile),
          };
        } catch (error) {
          console.error("Error processing image:", error);
          throw error;
        }
      }),
    );

    setUploadedImages((prev) => [...prev, ...processedImages]);
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setProfileId(localStorage.getItem("logged_in_profile"));
    }
  }, []);

  useEffect(() => {
    if (profileId) {
      getCurrentLocation();
      fetchAllChats();
      getMyProfile(profileId);
    }
  }, [profileId]);

  const fetchAllChats = async () => {
    try {
      let profileid = await localStorage.getItem("logged_in_profile");
      const response = await axios.get(
        `/api/user/mailbox?profileid=${profileid}&type=received`,
      );
      setChatList(response.data.data);
    } catch (err: any) {
      console.error("Error fetching chats:", err);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const locationName = await getLocationName(latitude, longitude);
          await sendLocationToAPI(locationName, latitude, longitude);
        },
        (error) => {
          console.error("Geolocation error:", error);
        },
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  };

  const getLocationName = async (latitude: number, longitude: number) => {
    const apiKey = "AIzaSyBEr0k_aQ_Sns6YbIQ4UBxCUTdPV9AhdF0";

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`,
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.status === "OK" && data.results.length > 0) {
        return data.results[0].formatted_address;
      }

      console.error("No results found or status not OK:", data);
      return "Unknown Location";
    } catch (error) {
      console.error("Error fetching location name:", error);
      return "Unknown Location";
    }
  };

  const sendLocationToAPI = async (
    locationName: string,
    latitude: number,
    longitude: number,
  ) => {
    if (!profileId) {
      console.error("Profile ID is missing.");
      return;
    }

    try {
      const response = await fetch("/api/user/location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileId,
          locationName,
          latitude,
          longitude,
        }),
      });

      const data = await response.json();
      if (response.ok) {
      } else {
        console.error("Error sending location:", data.message);
      }
    } catch (error) {
      console.error("Error sending location to API:", error);
    }
  };

  useEffect(() => {
    const fetchUserProfiles = async () => {
      if (loading || !hasMore) return;

      try {
        setLoading(true);
        const response = await fetch(
          `/api/user/sweeping?page=${page}&size=50&search=${encodeURIComponent(
            activeProfileSearch,
          )}`,
        );
        const data = await response.json();

        if (data?.profiles?.length > 0) {
          setUserProfiles((prevProfiles: any) =>
            page === 1 ? data.profiles : [...prevProfiles, ...data.profiles],
          );
        } else {
          setHasMore(false);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching user profiles:", error);
        setLoading(false);
      }
    };

    fetchUserProfiles();
  }, [page, activeProfileSearch]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  useEffect(() => {
    if (selectedUser) {
      setUserDeviceToken(selectedUser?.Device_Token);
    }
  }, [selectedUser]);

  const handleSendMail = async () => {
    if (!selectedUser || !newMail.subject || !newMail.message) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      const uploadedUrls = [];

      for (const image of uploadedImages) {
        try {
          const formData = new FormData();
          const blob = new Blob([image.file], { type: image.file.type });
          formData.append("image", blob, image.file.name);

          const response = await fetch("/api/user/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error("Failed to upload image");
          }

          const data = await response.json();
          uploadedUrls.push(data.blobUrl);
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.error("Error uploading image:", error);
          uploadedUrls.push("");
        }
      }

      const response = await fetch("/api/user/mailbox", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromId: profileId,
          toId: selectedUser?.Id,
          htmlBody: newMail.message,
          subject: newMail.subject,
          image1: uploadedUrls[0] || "", // Add image URLs to the message
          image2: uploadedUrls[1] || "", // Add image URLs to the message
          image3: uploadedUrls[2] || "", // Add image URLs to the message
          image4: uploadedUrls[3] || "", // Add image URLs to the message
          image5: uploadedUrls[4] || "", // Add image URLs to the message
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send email. Status: ${response.status}`);
      }

      // 4. Clean up and reset
      uploadedImages.forEach((image) => URL.revokeObjectURL(image.preview));
      setUploadedImages([]);
      sendNotification("Mail From Swing Social");
      setCreatingNew(false);
      setSelectedUser("");
      setNewMail({ subject: "", message: "" });
      fetchAllChats();
    } catch (error) {
      console.error("Error sending mail with images:", error);
      alert("Failed to send mail. Please try again.");
    }
  };

  const sendNotification = async (message: string) => {
    const response = await fetch("/api/user/notification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: selectedUser.Id,
        body: "Mail From Swing Social",
        image: "https://example.com/path/to/image.jpg",
        url: `https://app.swingsocial.co/mailbox/${selectedUser.Id}`,
      }),
    });

    const result = await response.json();
  };

  const deleteChat = async (chatId: any) => {
    setChatToDelete(chatId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteChat = async () => {
    if (!chatToDelete) return;
    setIsDeleting(true);

    try {
      const response = await fetch("/api/user/mailbox/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: chatToDelete }),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete chat. Status: ${response.status}`);
      }

      window.location.reload();
    } catch (error) {
      console.error(error);
      setDeleteDialogOpen(false);
      setIsDeleting(false);
      // Fallback alert using native window.alert since Swal was removed
      alert("Failed to delete the chat.");
    }
  };

  const handleCloseUserProfileModal = () => {
    setShowDetail(false);
    setSelectedUserId(null);
    if (window.history.state?.modal === "userProfile") {
      window.history.back();
    }
  };

  const handleGrantAccess = async () => {
    try {
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <>
      <Box
        sx={{
          minHeight: "100vh",
          background: "linear-gradient(160deg, #14071f 0%, #0a0412 100%)",
          color: "white",
          flexDirection: "column",
          display: "flex",
        }}
      >
        <AppHeaderMobile />
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            pb: "90px",
          }}
        >
          <Box
            sx={{
              display: "flex",
              bgcolor: "rgba(0,0,0,0.2)",
              backdropFilter: "blur(20px)",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            {["Chat", "Mailbox"].map((tab) => {
              const active = tab === "Mailbox";
              return (
                <Box
                  key={tab}
                  onClick={() =>
                    router.push(tab === "Chat" ? "/messaging" : "/mailbox")
                  }
                  sx={{
                    flex: 1,
                    textAlign: "center",
                    py: 2,
                    fontWeight: active ? 800 : 500,
                    fontSize: 15,
                    letterSpacing: 0.5,
                    cursor: "pointer",
                    color: active ? "#fff" : "rgba(255,255,255,0.4)",
                    transition: "all 0.3s ease",
                    position: "relative",
                    "&::after": active
                      ? {
                        content: '""',
                        position: "absolute",
                        bottom: 0,
                        left: "15%",
                        width: "70%",
                        height: "3px",
                        borderRadius: "10px",
                        background: "linear-gradient(90deg, #FF2D55, #7000FF)",
                        boxShadow: "0 0 10px rgba(255,45,85,0.4)",
                      }
                      : {},
                  }}
                >
                  {tab.toUpperCase()}
                </Box>
              );
            })}
          </Box>
          {/* Header Action Bar */}
          <Box
            sx={{
              background: "rgba(20, 7, 31, 0.8)",
              backdropFilter: "blur(20px)",
              position: "sticky",
              top: 0,
              zIndex: 10,
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              pb: 2
            }}
          >
            <Box sx={{ display: "flex", px: 2, pt: 2, pb: 1, gap: 1.5 }}>
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  bgcolor: "rgba(255,255,255,0.04)",
                  borderRadius: "12px",
                  px: 1.5,
                  py: 0.6,
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Search sx={{ fontSize: 16, color: "rgba(255,255,255,0.3)" }} />
                <TextField
                  fullWidth
                  variant="standard"
                  placeholder="Search mailbox..."
                  value={inboxSearchQuery}
                  onChange={(e) => setInboxSearchQuery(e.target.value)}
                  InputProps={{
                    disableUnderline: true,
                    sx: {
                      color: "white",
                      ml: 1,
                      fontSize: "0.85rem",
                      "& input::placeholder": {
                        color: "rgba(255,255,255,0.3)",
                        opacity: 1,
                      },
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Quick Action Buttons */}
            <Box sx={{ display: "flex", px: 2, pb: 0.5, gap: 1 }}>
              <Button
                onClick={handleCloseMailBox}
                fullWidth
                sx={{
                  background: "rgba(255,45,85,0.1)",
                  color: "#FF2D55",
                  borderRadius: "10px",
                  py: 0.8,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "none",
                  border: "1px solid rgba(255,45,85,0.2)",
                  display: "flex",
                  gap: 0.8,
                  "&:hover": {
                    background: "rgba(255,45,85,0.2)",
                  }
                }}
              >
                <Close sx={{ fontSize: 16, transform: 'rotate(45deg)' }} />
                Create Mail
              </Button>
              <Button
                onClick={() => router.push("/mailbox/sent")}
                fullWidth
                sx={{
                  background: "rgba(255,255,255,0.03)",
                  color: "rgba(255,255,255,0.7)",
                  borderRadius: "10px",
                  py: 0.8,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "none",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  gap: 0.8,
                  "&:hover": {
                    background: "rgba(255,255,255,0.06)",
                  }
                }}
              >
                <ArrowBack sx={{ fontSize: 16, transform: 'rotate(180deg)' }} />
                Sent Mails
              </Button>
            </Box>
          </Box>

          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              position: 'relative'
            }}
          >
            <List sx={{ pt: 1, pb: 4 }}>
              {chatList.length === 0 && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    py: 2,
                    px: 4,
                    textAlign: "center",
                  }}
                >
                  <Box
                    sx={{
                      width: 100,
                      height: 100,
                      mb: 4,

                      position: 'relative',
                      "&::after": {
                        content: '""',
                        position: 'absolute',
                        inset: -20,
                        background: 'radial-gradient(circle, rgba(255,45,85,0.15) 0%, transparent 70%)',
                        zIndex: -1
                      }
                    }}
                  >
                    <img
                      src="/empty_mailbox.png"
                      alt="No Mail"
                      style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 4, }}
                    />
                  </Box>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      mb: 1,
                      background: "linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.5) 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Mailbox Empty
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255,255,255,0.4)", mb: 4, maxWidth: 250 }}
                  >
                    Your inbox is quiet for now. Start a conversation or wait for new mail.
                  </Typography>
                  <Button
                    onClick={handleCloseMailBox}
                    variant="contained"
                    sx={{
                      background: "linear-gradient(90deg, #FF2D55, #7000FF)",
                      borderRadius: "100px",
                      px: 4,
                      py: 1.5,
                      color: "#fff",
                      textTransform: "none",
                      fontWeight: 700,
                      "&:hover": {
                        transform: "translateY(-2px)",
                      },
                      transition: "all 0.3s",
                    }}
                  >
                    Compose New Mail
                  </Button>
                </Box>
              )}

              {chatList
                .filter((chat: any) => {
                  if (!inboxSearchQuery) return true;
                  const search = inboxSearchQuery.toLowerCase();
                  return (
                    chat.ProfileFromUsername?.toLowerCase().includes(search) ||
                    chat.Subject?.toLowerCase().includes(search)
                  );
                })
                .map((chat: any, index: number) => {
                  const hasImage = /<img.*?src=["'](.*?)["']/.test(
                    chat.Conversation,
                  );

                  return (
                    <ListItem
                      onClick={() => handleMailClick(chat)}
                      sx={{
                        px: 1.5,
                        py: 1.2,
                        mx: 2,
                        mb: 1,
                        width: 'auto',
                        bgcolor: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        borderRadius: "16px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        transition: "all 0.2s",
                        "&:hover": {
                          bgcolor: "rgba(255,255,255,0.06)",
                          transform: "translateY(-2px)",
                          borderColor: "rgba(255,45,85,0.3)",
                        },
                      }}
                    >
                      {/* Avatar */}
                      <ListItemAvatar>
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          variant="dot"
                          sx={{
                            '& .MuiBadge-dot': {
                              backgroundColor: chat.IsOnline ? '#44b700' : '#gray',
                              color: chat.IsOnline ? '#44b700' : '#gray',
                              boxShadow: `0 0 0 2px #0A0A0A`,
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                            }
                          }}
                        >
                          <Avatar
                            src={chat.Avatar || "/noavatar.png"}
                            sx={{
                              width: 42,
                              height: 42,
                              border: "2px solid rgba(255,255,255,0.1)",
                              background: "linear-gradient(45deg, #FF2D55, #7000FF) border-box",
                            }}
                          />
                        </Badge>
                      </ListItemAvatar>

                      {/* Chat Info */}
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}>
                              {chat.ProfileFromUsername}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem" }}>
                              {chat.CreatedAt ? new Date(chat.CreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.5 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                color: chat.NewMessages > 0 ? "#fff" : "rgba(255,255,255,0.5)",
                                fontWeight: chat.NewMessages > 0 ? 600 : 400,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '180px'
                              }}
                            >
                              {hasImage ? "📷 Photo" : chat.Subject || "No subject"}
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              {chat.NewMessages > 0 && (
                                <Box
                                  sx={{
                                    bgcolor: "#FF2D55",
                                    color: "#fff",
                                    borderRadius: "10px",
                                    px: 1,
                                    py: 0.2,
                                    fontSize: "0.7rem",
                                    fontWeight: 800,
                                    boxShadow: "0 0 10px rgba(255,45,85,0.5)"
                                  }}
                                >
                                  {chat.NewMessages}
                                </Box>
                              )}
                              <IconButton
                                size="small"
                                sx={{
                                  color: "rgba(255, 45, 85, 0.7)",
                                  "&:hover": {
                                    backgroundColor: "rgba(255, 45, 85, 0.1)",
                                    color: "#FF2D55"
                                  },
                                }}
                                onClick={(event) => {
                                  event.stopPropagation(); // Prevent the redirection
                                  deleteChat(chat?.MessageId); // Call the delete function
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                        }
                        sx={{ flex: 1, ml: 2 }}
                      />
                    </ListItem>
                  );
                })}
            </List>
          </Box>

          {chatList.length > 0 && (
            <Box
              onClick={handleCloseMailBox}
              sx={{
                position: "fixed",
                bottom: 100,
                right: 20,
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #FF2D55, #7000FF)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 10,
                transition: "all 0.3s",
              }}
            >
              <Close sx={{ color: "white", fontSize: 32, transform: 'rotate(45deg)' }} />
            </Box>
          )}
        </Box>

        {/* Dialog */}
        <Dialog
          open={open}
          onClose={handleClose}
          fullWidth
          maxWidth="xs" // Make the dialog width full on mobile
          sx={{
            "& .MuiPaper-root": {
              backgroundColor: "#121212",
              color: "white",
              width: "100%",
              margin: 1,
            },
          }}
        >
          {/* Title Row */}
          <DialogTitle
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              bgcolor: "#000",
              py: 2,
              paddingLeft: 0, // Align the back button to the left
            }}
          >
            {/* Back Icon */}
            <IconButton
              onClick={handleClose}
              sx={{
                color: "white",
                marginRight: "auto", // Push the back icon to the left
              }}
            >
              <ArrowBack />
            </IconButton>
            <Typography
              variant="h6"
              sx={{ color: "white", fontWeight: "bold" }}
            >
              Sent Mails
            </Typography>
            <Button
              variant="contained"
              sx={{ backgroundColor: "#FF1B6B" }}
              onClick={handleClose}
            >
              Inbox
            </Button>
          </DialogTitle>

          {/* Search Row */}
          <DialogContent dividers>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                variant="standard"
                placeholder="Search..."
                value={sentSearchQuery}
                onChange={(e) => setSentSearchQuery(e.target.value)}
                InputProps={{
                  sx: {
                    backgroundColor: "white",
                    borderBottom: "2px solid black",
                    "&:focus-within": { borderBottom: "2px solid #FF1B6B" },
                    px: 1,
                  },
                }}
              />
              <Button variant="contained" sx={{ backgroundColor: "#FF1B6B" }}>
                <Search />
              </Button>
            </Box>

            {/* Sent Mails List */}
            <List>
              {chatList.length === 0 ? (
                <Typography
                  variant="body2"
                  color="gray"
                  textAlign="center"
                  sx={{ py: 2 }}
                >
                  No Sent Mails Found
                </Typography>
              ) : (
                chatList
                  .filter((chat: any) => {
                    if (!sentSearchQuery) return true;
                    const search = sentSearchQuery.toLowerCase();
                    return (
                      chat.ProfileFromUsername?.toLowerCase().includes(search) ||
                      chat.Subject?.toLowerCase().includes(search)
                    );
                  })
                  .map((chat: any) => (
                    <ListItem
                      key={chat.MessageId}
                      sx={{
                        px: 2,
                        py: 1,
                        bgcolor: "#000",
                        borderRadius: 2,
                        cursor: "pointer",
                        mt: 1,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        "&:hover": { bgcolor: "rgba(255, 255, 255, 0.1)" },
                      }}
                    >
                      {/* Avatar */}
                      <ListItemAvatar>
                        <Box
                          sx={{
                            width: 35,
                            height: 35,
                            borderRadius: "50%",
                            border: "2px solid",
                            borderColor: "#FF1B6B",
                            overflow: "hidden",
                          }}
                        >
                          <img
                            src={chat.Avatar || "/noavatar.png"}
                            alt="Profile"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </Box>
                      </ListItemAvatar>

                      {/* Chat Info */}
                      <ListItemText
                        primary={
                          <Typography
                            sx={{ color: "#FF1B6B", fontWeight: "bold" }}
                          >
                            {chat.ProfileFromUsername}
                          </Typography>
                        }
                        secondary={chat.Subject || "No message yet"}
                        sx={{ flex: 1, ml: 1 }}
                      />

                      {/* Last Updated & Delete */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ color: "gray", fontSize: "0.75rem" }}
                        >
                          {chat.CreatedAt || "N/A"}
                        </Typography>

                        <IconButton
                          sx={{
                            backgroundColor: "rgba(255, 0, 0, 0.2)",
                            color: "red",
                            "&:hover": {
                              backgroundColor: "rgba(255, 0, 0, 0.4)",
                            },
                          }}
                          onClick={() => deleteChat(chat?.ChatId)}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </ListItem>
                  ))
              )}
            </List>
          </DialogContent>
        </Dialog>

        {/* mailBoxModal */}
        <Drawer
          anchor="bottom"
          open={mailBoxOpen}
          onClose={handleCloseMailBox}
          ModalProps={{ keepMounted: true }}
          PaperProps={{
            sx: {
              height: drawerHeight,
              background: "linear-gradient(160deg, #14071f 0%, #0a0412 100%)",
              borderTopLeftRadius: drawerHeight === "100vh" ? 0 : 30,
              borderTopRightRadius: drawerHeight === "100vh" ? 0 : 30,
              overflow: "hidden",
              transition: "height 0.25s ease",
              boxShadow: "0 -10px 40px rgba(0,0,0,0.5)",
            },
          }}
        >
          {/* Header Row */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 2,
              pb: 1.5,
              borderBottom: "1px solid rgba(255,255,255,0.05)"
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton
                onClick={handleCloseMailBox}
                sx={{
                  color: "rgba(255,255,255,0.7)",
                  "&:hover": { color: "#FF2D55", bgcolor: "rgba(255,45,85,0.1)" }
                }}
              >
                <ArrowBack />
              </IconButton>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  background: "linear-gradient(90deg, #fff, rgba(255,255,255,0.7))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontSize: "1.2rem"
                }}
              >
                Create New Mail
              </Typography>
            </Box>
          </Box>

          {/* Mail Form Content */}
          <Box
            sx={{
              p: 2.5,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 3,
              "&::-webkit-scrollbar": { width: "6px" },
              "&::-webkit-scrollbar-thumb": { background: "rgba(255,255,255,0.2)", borderRadius: "10px" },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                bgcolor: "rgba(255,255,255,0.04)",
                px: 2.5,
                py: 1.5,
                borderRadius: "16px",
                border: "1px solid rgba(255,255,255,0.08)",
                transition: "all 0.3s ease",
                "&:focus-within": {
                  borderColor: "#FF2D55",
                  bgcolor: "rgba(255,255,255,0.06)",
                }
              }}
            >
              <Search sx={{ color: "rgba(255,255,255,0.4)", fontSize: 22 }} />

              <TextField
                variant="standard"
                placeholder="Search profiles"
                fullWidth
                value={mailSearchQuery}
                onChange={(e) => setMailSearchQuery(e.target.value)}
                InputProps={{
                  disableUnderline: true,
                  sx: {
                    color: "#fff",
                    fontSize: 14,

                    "& input": {
                      backgroundColor: "transparent",
                      color: "#fff",
                    },

                    "& input::placeholder": {
                      color: "rgba(255,255,255,0.45)",
                    },
                  },
                }}
              />
            </Box>
            {/* <Box sx={{ display: "flex", alignItems: "center" }}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Search user..."
                value={mailSearchQuery}
                onChange={(e) => setMailSearchQuery(e.target.value)}
                InputProps={{
                  sx: {
                    color: "white",
                    borderRadius: "12px",
                    bgcolor: "rgba(255,255,255,0.05)",
                    "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                    "&.Mui-focused fieldset": { borderColor: "#FF2D55" },
                  },
                }}
              />
            </Box> */}
            {mailSearchQuery && (
              <List sx={{ maxHeight: "450px", overflowY: "auto", "&::-webkit-scrollbar": { width: "4px" }, "&::-webkit-scrollbar-thumb": { background: "rgba(255,255,255,0.1)", borderRadius: "10px" } }}>
                {loading && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      py: 2,
                    }}
                  >
                    <CircularProgress size={24} />
                  </Box>
                )}

                {!selectedUser &&
                  userProfiles.map((user: any) => (
                    <ListItem
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      sx={{
                        px: 2,
                        py: 1,
                        bgcolor: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        borderRadius: "12px",
                        cursor: "pointer",
                        mt: 1,
                        "&:hover": { bgcolor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,45,85,0.5)" },
                      }}
                    >
                      <ListItemAvatar>
                        <Box
                          sx={{
                            width: 35,
                            height: 35,
                            borderRadius: "50%",
                            overflow: "hidden",
                          }}
                        >
                          <img
                            src={user.Avatar || "/noavatar.png"}
                            alt="Avatar"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </Box>
                      </ListItemAvatar>
                      <ListItemText
                        primaryTypographyProps={{ color: "white" }}
                        secondaryTypographyProps={{ color: "gray" }}
                        primary={user.Username}
                        secondary={user.Location || "N/A"}
                      />
                    </ListItem>
                  ))}
              </List>
            )}
            <Box sx={{ width: "100%", mt: 1 }}>
              {selectedUser && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, bgcolor: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <Avatar src={selectedUser.Avatar || "/noavatar.png"} sx={{ width: 40, height: 40 }} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem" }}>
                        Sending to
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
                        {selectedUser?.Username}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Subject Field */}
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Subject"
                    value={newMail.subject}
                    onChange={(e) =>
                      setNewMail((prev) => ({
                        ...prev,
                        subject: e.target.value,
                      }))
                    }
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        color: "white",
                        bgcolor: "rgba(255,255,255,0.03)",
                        borderRadius: "12px",
                        "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                        "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                        "&.Mui-focused fieldset": { borderColor: "#FF2D55" },
                      },
                      input: { color: "white", padding: "14px" },
                    }}
                  />

                  {/* Message Field */}
                  <TextField
                    fullWidth
                    variant="outlined"
                    multiline
                    rows={5}
                    placeholder="Type your mail here..."
                    value={newMail.message}
                    onChange={(e) =>
                      setNewMail((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        color: "white",
                        bgcolor: "rgba(255,255,255,0.03)",
                        borderRadius: "16px",
                        "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                        "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                        "&.Mui-focused fieldset": { borderColor: "#FF2D55" },
                      },
                      textarea: { color: "white" },
                    }}
                  />

                  {/* Image Upload Section */}
                  <Box sx={{ mb: 2 }}>
                    <input
                      accept="image/*"
                      style={{ display: "none" }}
                      id="image-upload"
                      type="file"
                      onChange={handleImageUpload}
                      multiple
                    />
                    <label htmlFor="image-upload">
                      <Button
                        component="span"
                        variant="outlined"
                        startIcon={<AddPhotoAlternate />}
                        sx={{
                          color: "rgba(255,255,255,0.7)",
                          borderColor: "rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                          textTransform: "none",
                          "&:hover": {
                            borderColor: "#FF2D55",
                            bgcolor: "rgba(255,45,85,0.05)",
                            color: "white"
                          },
                        }}
                        disabled={uploadedImages.length >= 5}
                      >
                        Add Images ({uploadedImages.length}/5)
                      </Button>
                    </label>

                    {/* Image Preview Grid */}
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 1,
                        mt: 2,
                      }}
                    >
                      {uploadedImages.map((image, index) => (
                        <Box
                          key={index}
                          sx={{
                            position: "relative",
                            width: 100,
                            height: 100,
                          }}
                        >
                          <img
                            src={image.preview}
                            alt={`Upload ${index + 1}`}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              borderRadius: "8px",
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveImage(index)}
                            sx={{
                              position: "absolute",
                              top: -8,
                              right: -8,
                              bgcolor: "rgba(255, 27, 107, 0.9)",
                              backdropFilter: "blur(4px)",
                              color: "white",
                              "&:hover": {
                                bgcolor: "#FF2D55",
                              },
                            }}
                          >
                            <Close fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  {/* Send Button */}
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{
                      background: "linear-gradient(90deg, #FF2D55, #7000FF)",
                      color: "white",
                      fontWeight: "bold",
                      py: 1.5,
                      borderRadius: "12px",
                      textTransform: "none",
                      fontSize: "1rem",
                      boxShadow: "0 4px 15px rgba(255,45,85,0.3)",
                      "&:hover": {
                        background: "linear-gradient(90deg, #FF4081, #8A2BE2)",
                      },
                    }}
                    onClick={handleSendMail}
                  >
                    Send Mail
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        </Drawer>

        {/* chatBoxModal */}
        <Dialog
          open={chatOpen}
          onClose={handleCloseChatBox}
          fullWidth
          maxWidth="sm"
          BackdropProps={{
            sx: {
              backdropFilter: "blur(8px)",
            },
          }}
          PaperProps={{
            style: {
              color: "white",
              borderRadius: 24,
              background: "rgba(20, 10, 35, 0.95)",
              backdropFilter: "blur(25px)",
              border: "1px solid rgba(255,255,255,0.08)",
              margin: "12px",
              width: "calc(100% - 24px)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            },
          }}
        >
          {/* Title Row */}
          <Box sx={{ position: 'relative', p: 2, pb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                onClick={handleCloseChatBox}
                sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "#FF2D55", bgcolor: "rgba(255,45,85,0.1)" } }}
              >
                <ArrowBack />
              </IconButton>
              <Typography variant="h6" sx={{ fontWeight: 800, background: "linear-gradient(90deg, #fff, rgba(255,255,255,0.7))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: "1.2rem" }}>
                New Message
              </Typography>
            </Box>
          </Box>

          {/* Search Form */}
          <DialogContent
            sx={{
              px: 2.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              overflowY: "auto",
              "&::-webkit-scrollbar": { width: "6px" },
              "&::-webkit-scrollbar-thumb": { background: "rgba(255,255,255,0.2)", borderRadius: "10px" },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", width: "100%", mt: 1 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search profiles"
                value={chatSearchQuery}
                onChange={(e) => setChatSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ fontSize: 20, color: "rgba(255,255,255,0.5)" }} />
                    </InputAdornment>
                  ),
                  endAdornment: chatSearchQuery ? (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setChatSearchQuery("")} edge="end" size="small" sx={{ color: "rgba(255,255,255,0.5)" }}>
                        <Close fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                  sx: {
                    color: "white",
                    borderRadius: "16px",
                    bgcolor: "rgba(255,255,255,0.03)",
                    "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                    "&.Mui-focused fieldset": { borderColor: "#FF2D55" },
                  },
                }}
              />
            </Box>
            {chatSearchQuery && (
              <List sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {loading && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      py: 3,
                    }}
                  >
                    <CircularProgress size={24} sx={{ color: "#FF2D55" }} />
                  </Box>
                )}

                {!selectedUser &&
                  userProfiles.map((user: any) => (
                    <ListItem
                      key={user.Id}
                      onClick={() => router.push("/messaging/" + user?.Id)}
                      sx={{
                        p: 2,
                        bgcolor: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        borderRadius: "16px",
                        cursor: "pointer",
                        display: "flex",
                        gap: 2,
                        "&:hover": { bgcolor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,45,85,0.5)" },
                      }}
                    >
                      <Avatar
                        src={user.Avatar || "/noavatar.png"}
                        sx={{ width: 48, height: 48 }}
                      />
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body1" sx={{ color: "white", fontWeight: 600 }}>
                          {user.Username}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
                            Tap to start chatting
                          </Typography>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="rgba(255,255,255,0.5)">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                          </svg>
                        </Box>
                      </Box>
                    </ListItem>
                  ))}
              </List>
            )}
          </DialogContent>
        </Dialog>

        <Dialog
          open={openModal}
          onClose={() => setOpenModal(false)}
          fullWidth
          maxWidth="md"
          BackdropProps={{
            sx: {
              backdropFilter: "blur(8px)",
            },
          }}
          PaperProps={{
            style: {
              color: "white",
              borderRadius: 4,
              background: "rgba(20, 10, 35, 0.95)",
              backdropFilter: "blur(25px)",
              border: "1px solid rgba(255,255,255,0.08)",
              margin: "12px",
              width: "calc(100% - 24px)",
            },
          }}
        >
          <Box sx={{ position: 'relative', p: 2.5, pb: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, background: "linear-gradient(90deg, #fff, rgba(255,255,255,0.7))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: "1.2rem" }}>
              Mail Details
            </Typography>
            <IconButton
              onClick={() => setOpenModal(false)}
              sx={{ color: "rgba(255,255,255,0.4)", "&:hover": { color: "#FF2D55", bgcolor: "rgba(255,45,85,0.1)" } }}
            >
              <Close />
            </IconButton>
          </Box>
          <DialogContent
            sx={{
              mt: 1,
              px: 2.5,
              pb: 2.5,
              maxHeight: "65vh",
              overflowY: "auto",
              scrollBehavior: "smooth",
              "&::-webkit-scrollbar": {
                width: "6px",
              },
              "&::-webkit-scrollbar-track": {
                background: "transparent",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "rgba(255,255,255,0.2)",
                borderRadius: "10px",
              },
            }}
            ref={(el: HTMLDivElement | null) => {
              if (el) {
                el.scrollTop = el.scrollHeight;
              }
            }}
          >
            {selectedMail?.subject === "Friend Request" ? (
              <Box sx={{ width: "100%", mb: 2, mt: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, p: 2, borderRadius: 4, bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <Avatar
                    sx={{ width: 56, height: 56, border: "2px solid #FF2D55" }}
                    alt={selectedMail?.from || "User"}
                    src={selectedMail?.Avatar || "/noavatar.png"}
                    onClick={() => {
                      setShowDetail(true);
                      setSelectedUserId(selectedMail?.ProfileFromId);
                      window.history.pushState({ modal: "userProfile" }, "");
                    }}
                  />
                  <Box>
                    <Typography variant="h6" color="white" sx={{ fontWeight: 700 }}>
                      {selectedMail?.from || "User"}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)" }}>
                      Sent you a friend request
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ textAlign: "center", p: 4, bgcolor: "rgba(0,0,0,0.2)", borderRadius: 5, border: "1px solid rgba(255,255,255,0.02)" }}>
                  <Box sx={{ mb: 2, display: 'inline-flex', p: 2, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(255,45,85,0.2), rgba(112,0,255,0.2))' }}>
                    <Typography sx={{ fontSize: '2rem' }}>🤝</Typography>
                  </Box>
                  <Typography variant="h6" sx={{ color: "#fff", mb: 1, fontWeight: 700 }}>Friend Request</Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.6)", mb: 4, fontSize: '0.9rem' }}>
                    Connect with {selectedMail?.from} to share updates and chat.
                  </Typography>

                  <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
                    <Button
                      onClick={() => {
                        fetch("/api/user/profile/friend/accept", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            fromId: selectedMail.ProfileFromId,
                            toId: selectedMail.ProfileToId,
                            Id: selectedMail.id,
                          }),
                        }).then(() => {
                          window.location.reload();
                        });
                      }}
                      sx={{
                        flex: 1,
                        background: "linear-gradient(90deg, #FF2D55, #7000FF)",
                        color: "white",
                        borderRadius: "14px",
                        py: 1.5,
                        fontWeight: 700,
                        boxShadow: "0 4px 15px rgba(255,45,85,0.3)",
                      }}
                    >
                      Accept
                    </Button>
                    <Button
                      onClick={() => {
                        fetch("/api/user/profile/friend/decline", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            fromId: selectedMail.ProfileFromId,
                            toId: selectedMail.ProfileToId,
                            Id: selectedMail.id,
                          }),
                        }).then(() => {
                          window.location.reload();
                        });
                      }}
                      sx={{
                        flex: 1,
                        bgcolor: "rgba(255,255,255,0.05)",
                        color: "white",
                        borderRadius: "14px",
                        py: 1.5,
                        fontWeight: 600,
                        border: "1px solid rgba(255,255,255,0.1)",
                        "&:hover": { bgcolor: "rgba(255,255,255,0.1)" }
                      }}
                    >
                      Decline
                    </Button>
                  </Box>
                </Box>
              </Box>
            ) : (
              selectedMailsWithReply.map((mail, index) => (
                <Box
                  key={index}
                  sx={{
                    width: "100%",
                    mb: 4,
                  }}
                >
                  {/* Message Header */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Avatar
                        sx={{
                          width: 38,
                          height: 38,
                          border: "2px solid rgba(255,255,255,0.1)",
                          background: "linear-gradient(45deg, #FF2D55, #7000FF) border-box",
                        }}
                        alt={mail?.ProfileFromUsername || "User"}
                        src={mail?.Avatar || "/noavatar.png"}
                        onClick={() => {
                          setShowDetail(true);
                          setSelectedUserId(mail?.ProfileIdFrom);
                          window.history.pushState({ modal: "userProfile" }, "");
                        }}
                      />
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 700, lineHeight: 1.2, fontSize: "0.95rem" }}>
                          {mail.ProfileFromUsername || "User"}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: "0.8rem" }}>
                          {index === 0 ? mail.Subject : `RE: ${mail.Subject}`}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap", fontSize: "0.7rem" }}>
                      {mail.CreatedAt ? new Date(mail.CreatedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }) : ""}
                    </Typography>
                  </Box>

                  {/* Message Body */}
                  <Box
                    sx={{
                      bgcolor: index === 0 ? "rgba(255, 45, 85, 0.05)" : "rgba(255,255,255,0.03)",
                      border: index === 0 ? "1px solid rgba(255, 45, 85, 0.3)" : "1px solid rgba(255,255,255,0.05)",
                      p: 2,
                      borderRadius: 4,
                      borderTopLeftRadius: index === 0 ? 4 : 20, // Subtle chat bubble effect
                    }}
                  >
                    <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.9)", lineHeight: 1.5, whiteSpace: "pre-wrap", fontSize: "0.9rem" }}>
                      {mail.Body}
                    </Typography>
                    {/* Images Grid */}
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(150px, 1fr))",
                        gap: 2,
                        mt: 2,
                      }}
                    >
                      {[
                        mail.Image,
                        mail.Image_1,
                        mail.Image_2,
                        mail.Image_3,
                        mail.Image_4,
                      ]
                        .filter((img) => img)
                        .map((img, imgIndex) => (
                          <img
                            onClick={() => {
                              if (img) {
                                setExpandedImage(img);
                                setImageModalOpen(true);
                              }
                            }}
                            key={imgIndex}
                            src={img}
                            alt={`Attachment ${imgIndex + 1}`}
                            style={{
                              width: "100%",
                              height: "150px",
                              objectFit: "cover",
                              borderRadius: "8px",
                            }}
                          />
                        ))}
                    </Box>
                  </Box>
                </Box>
              ))
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2.5, pt: 1.5, borderTop: "1px solid rgba(255,255,255,0.05)", gap: 1.5 }}>
            <Button
              onClick={() => setOpenModal(false)}
              fullWidth
              sx={{
                borderRadius: "12px",
                py: 1.2,
                color: "rgba(255,255,255,0.7)",
                bgcolor: "rgba(255,255,255,0.05)",
                fontWeight: 600,
                fontSize: "0.9rem",
                border: "1px solid rgba(255,255,255,0.1)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.1)" }
              }}
            >
              Close
            </Button>
            <Button
              onClick={() => setReplyModalOpen(true)}
              fullWidth
              sx={{
                borderRadius: "12px",
                py: 1.2,
                background: "linear-gradient(90deg, #FF2D55, #7000FF)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.9rem",
                boxShadow: "0 4px 15px rgba(255,45,85,0.3)",
                "&:hover": { opacity: 0.9 }
              }}
            >
              Reply
            </Button>
          </DialogActions>
          <ReplyModal
            open={replyModalOpen}
            onClose={() => setReplyModalOpen(false)}
            selectedMail={selectedMail}
            profileId={profileId}
            selectedMailsWithReply={selectedMailsWithReply}
            onReplySuccess={async () => {
              if (selectedMail?.id) {
                try {
                  const result = await fetch(
                    `/api/user/mailbox/reply?chatid=${selectedMail.id}`
                  );
                  const mails = await result.json();
                  setSelectedMailsWithReply(mails.data);
                } catch (error) {
                  console.error("Failed to fetch mail replies after send:", error);
                }
              }
              fetchAllChats();
            }}
          />
        </Dialog>

        {/* Image Modal */}
        <Dialog
          open={imageModalOpen}
          onClose={() => setImageModalOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogContent
            sx={{
              p: 0,
              bgcolor: "#000",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <img
              src={expandedImage || ""}
              alt="Expanded view"
              style={{
                maxWidth: "100%",
                maxHeight: "90vh",
                objectFit: "contain",
              }}
            />
          </DialogContent>
          <IconButton
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: "white",
            }}
            onClick={() => setImageModalOpen(false)}
          >
            <Close />
          </IconButton>
        </Dialog>
      </Box>

      <CustomDialog
        open={deleteDialogOpen}
        title="Delete Mail"
        description="Are you sure you want to permanently delete this mail? This action cannot be undone."
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDeleteChat}
        confirmText="Delete"
        cancelText="Cancel"
        icon={<Delete sx={{ color: "#fff", fontSize: 35 }} />}
      />

      <CustomDialog
        open={premiumDialogOpen}
        title="Upgrade your membership"
        description="Sorry, to access this page, you need to upgrade your membership"
        icon={<WorkspacePremiumIcon sx={{ color: "#fff", fontSize: 40 }} />}
        confirmText="Upgrade"
        cancelText="Close"
        onClose={() => {
          setPremiumDialogOpen(false);
          router.push(premiumDialogCancelRoute);
        }}
        onConfirm={async () => {
          setPremiumDialogOpen(false);
          router.push("/membership");
        }}
      />

      <CustomDialog
        open={errorDialogOpen}
        title="Error!"
        description={errorDialogMessage}
        icon={<Close sx={{ color: "#fff", fontSize: 40 }} />}
        confirmText="OK"
        onClose={() => setErrorDialogOpen(false)}
        onConfirm={async () => setErrorDialogOpen(false)}
      />

      <AppFooterMobile />

      <UserProfileModal
        handleGrantAccess={handleGrantAccess}
        handleClose={handleCloseUserProfileModal}
        open={showDetail}
        userid={selectedUserId}
      />

      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 9999, flexDirection: 'column', gap: 2 }}
        open={isDeleting}
      >
        <CircularProgress color="inherit" />
        <Typography variant="body1" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
          Deleting Mail...
        </Typography>
      </Backdrop>
    </>
  );
};

export default MobileInbox;
