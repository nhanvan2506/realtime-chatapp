import { useState, useRef } from "react";
import { LogOutIcon, VolumeOffIcon, Volume2Icon } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const mouseClickSound = new Audio("/sounds/mouse-click.mp3");

function ProfileHeader() {
  const {logout, authUser, updateProfile} = useAuthStore();
  const {isSoundEnabled, toggleSound} = useChatStore();
  const [selectedImg, setSelectedImg] = useState(null);

  const fileInputRef = useRef(null);

  const compressImage = (file, maxSizeMB = 1) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onloadend = () => {
        const img = new Image()
        img.src = reader.result
        img.onload = () => {
          const canvas = document.createElement("canvas")
          let { width, height } = img
          const maxDimension = 1024
          if (width > maxDimension || height > maxDimension) {
            const ratio = Math.min(maxDimension / width, maxDimension / height)
            width *= ratio
            height *= ratio
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext("2d")
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL("image/jpeg", 0.8))
        }
      }
    })
  }

  const handleImageUpload = async (e) =>{
    const file = e.target.files[0]
    if (!file){
      return
    }

    const compressedImage = await compressImage(file)
    setSelectedImg(compressedImage)
    await updateProfile({profilePic: compressedImage});
  };

  return (
    <div className="p-4 border-b border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div className="avatar online">
            <button
              className="size-11 rounded-full overflow-hidden relative group ring-2 ring-cyan-400/40 hover:ring-cyan-400/70 transition-shadow"
              onClick={() => fileInputRef.current.click()}
            >
              <img
                src={selectedImg || authUser.profilePic || "/avatar.png"}
                alt="User image"
                className="size-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-white text-[10px]">Change</span>
              </div>
            </button>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Username & online text */}
          <div className="min-w-0">
            <h3 className="text-slate-100 font-semibold text-sm truncate">
              {authUser.fullName}
            </h3>

            <p className="text-slate-400 text-[11px]">Online</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-1 items-center">
          {/* Sound toggle button */}
          <button
            className="p-2 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/10 transition-colors"
            onClick={() => {
              // play click sound before toggling
              mouseClickSound.currentTime = 0; // reset to start
              mouseClickSound.play().catch((error) => console.log("Audio play failed:", error));
              toggleSound();
            }}
          >
            {isSoundEnabled ? (
              <Volume2Icon className="size-4.5" />
            ) : (
              <VolumeOffIcon className="size-4.5" />
            )}
          </button>

          {/* Logout button */}
          <button className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors" onClick={logout}>
            <LogOutIcon className="size-4.5"/>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfileHeader