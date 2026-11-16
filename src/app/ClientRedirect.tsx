"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/commonPage/Loader";

export default function ClientRedirect() {
  const router = useRouter();

  useEffect(() => {
    const tokenDevice = localStorage.getItem("loginInfo");
    if (tokenDevice) {
      router.push("/home");
    } else {
      router.push("/login");
    }
  }, [router]);

  return <Loader />;
}
