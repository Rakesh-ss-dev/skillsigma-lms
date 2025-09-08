
import { useAuth } from "../../context/AuthContext";
export default function UserMetaCard() {
  const { user } = useAuth();
  const MEDIA_URL = import.meta.env.VITE_MEDIA_URL
  const name =
    user?.firstname || user?.lastname
      ? `${user?.firstname ?? ""} ${user?.lastname ?? ""}`.trim()
      : user?.username ?? "Guest";
  const imageUrl = user?.avatar === null ? '/images/user/user-icon.png' : `${MEDIA_URL}${user?.avatar}`;
  return (user) ? (
    <>

      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <img src={imageUrl} alt="user" />
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
        </div>
      </div>
    </>
  ) : <div>Loading...</div>;
}
