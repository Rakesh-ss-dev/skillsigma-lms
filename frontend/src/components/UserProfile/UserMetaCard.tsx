
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../hooks/useModal";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { MdOutlinePassword } from "react-icons/md";
import { SlPicture } from "react-icons/sl";
import FileInput from "../form/input/FileInput";
import isImageOrSvg from "../util/isImageorSvg";
interface ModalFormState {
  type: "password" | "picture";
}


export default function UserMetaCard() {
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { isOpen, openModal, closeModal } = useModal();
  const { user, logout, updateUserProfile } = useAuth();
  const MEDIA_URL = import.meta.env.VITE_MEDIA_URL
  const name =
    user?.first_name || user?.last_name
      ? `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim()
      : user?.username ?? "Guest";
  const imageUrl = !user?.avatar
    ? "/images/user/user-icon.png"
    : user.avatar.includes("http")
      ? user.avatar
      : `${MEDIA_URL}${user.avatar}`;
  const [password, setPassword] = useState<string>()
  const [newPassword, setNewPassword] = useState<string>();
  const [confirmPassword, setConfirmPassword] = useState<string>();
  const [modalForm, setModalForm] = useState<ModalFormState>({ type: "password" });
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!isImageOrSvg(f)) {
      setError("Only image files are allowed (PNG, JPG, GIF, SVG).");
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    setError(null);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f)); // safe for preview via <img>
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const openModalForm = (type: any) => {
    setModalForm({ type: type })
    openModal();
  }


  const closebtnClick = () => {
    setFile(null);
    setPassword("");
    setNewPassword("");
    setConfirmPassword("");
    closeModal();
  }


  const handleSave = async (e: any) => {
    e.preventDefault();
    try {
      const response = await API.patch(
        "/auth/changePassword/",
        {
          old_password: password,
          new_password: newPassword,
          confirm_password: confirmPassword,
        },
      );
      toast.success(response.data.detail + " Please login again");
      logout();
    } catch (error: any) {
      if (error.response) {
        if (typeof (error.response.data.error) === "object")
          toast.error(error.response.data.error[0]);
        else
          toast.error(error.response.data.error);
      } else {
        toast.error("Something went wrong:" + error.message);
      }
    }
  };
  const changeProfilePic = async (e: any) => {
    e.preventDefault();
    try {

      if (!file) return toast.error("Please select an image first.");
      await updateUserProfile({
        avatar: file,
      },);
      toast.success("Profile pic updated");
      setFile(null);
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
      closeModal();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Update failed");
    }
  }
  return (user) ? (
    <>

      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <img className="w-full h-full object-cover" src={imageUrl} alt="user" />
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {name}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => openModalForm('picture')}
            className="flex w-full text-nowrap items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <SlPicture />
            Change Profile Picture
          </button>
          <button
            onClick={() => openModalForm('profile')}
            className="flex w-full text-nowrap items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <MdOutlinePassword />
            Change Password
          </button>
        </div>
        <Modal isOpen={isOpen} dismissable={false} onClose={closeModal} className="max-w-[700px] m-4">
          <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
            {modalForm.type === 'picture' ?
              <form onSubmit={changeProfilePic} encType="multipart/form-data">
                <div className="custom-scrollbar max-h-[450px] overflow-y-auto px-2 pb-3">
                  <div className="mt-7">
                    <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                      Change Profile Picture
                    </h5>
                  </div>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-1">
                    <div className="col-span-2 lg:col-span-1">
                      <FileInput onChange={handleFileChange} className="custom-class" />
                      {error && <p className="text-red-600 text-sm">{error}</p>}

                      {previewUrl && (
                        <div className="w-48 h-48 border rounded overflow-hidden flex items-center justify-center">
                          {/* Using <img> prevents any SVG scripts from running */}
                          <img src={previewUrl} alt="preview" className="max-w-full max-h-full" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                    <Button size="sm" variant="outline" onClick={closebtnClick}>
                      Close
                    </Button>
                    <Button size="sm" type="submit">
                      Change Profile Picture
                    </Button>
                  </div>
                </div>
              </form> :
              <form onSubmit={handleSave} className="flex flex-col">
                <div className="custom-scrollbar max-h-[450px] overflow-y-auto px-2 pb-3">
                  <div className="mt-7">
                    <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                      Change Password
                    </h5>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-1">
                      <div className="col-span-2 lg:col-span-1">
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter current password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                          <span
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                          >
                            {showPassword ? (
                              <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                            ) : (
                              <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-2 lg:col-span-1">
                        <div className="relative">
                          <Input
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                          />
                          <span
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                          >
                            {showNewPassword ? (
                              <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                            ) : (
                              <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-2 lg:col-span-1">
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                          <span
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                          >
                            {showConfirmPassword ? (
                              <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                            ) : (
                              <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                            )}
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                  <Button size="sm" variant="outline" onClick={closebtnClick}>
                    Close
                  </Button>
                  <Button size="sm" type="submit">
                    Change Password
                  </Button>
                </div>
              </form>
            }
          </div>
        </Modal>
      </div>
    </>
  ) : <div>Loading...</div>;
}
