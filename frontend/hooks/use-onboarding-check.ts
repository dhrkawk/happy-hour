import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";

export function useOnboardingCheck() {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkStatus = async () => {
      // 로컬 스토리지에 확인 완료 기록이 있으면 바로 통과
      if (localStorage.getItem("onboardingChecked") === "true") {
        setIsReady(true);
        return;
      }

      // 사용자 정보 확인
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      // 프로필 정보 확인
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (!profile) {
        router.replace("/onboarding");
      } else {
        localStorage.setItem("onboardingChecked", "true");
        setIsReady(true);
      }
    };

    checkStatus();
  }, [router, supabase]);

  return { isReady };
}