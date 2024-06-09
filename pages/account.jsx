import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Navbar from "@/components/navbar";
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Checkbox,
  CheckboxGroup,
} from "@nextui-org/react";
import { useCheckbox, Chip, VisuallyHidden, tv } from "@nextui-org/react";
import { CheckIcon } from "@/components/CheckIcon.jsx";

const checkbox = tv({
  slots: {
    base: "border-default hover:bg-default-200",
    content: "text-default-500",
  },
  variants: {
    isSelected: {
      true: {
        base: "border-primary bg-primary hover:bg-primary-500 hover:border-primary-500",
        content: "text-primary-foreground pl-1",
      },
    },
    isFocusVisible: {
      true: {
        base: "outline-none ring-2 ring-focus ring-offset-2 ring-offset-background",
      },
    },
  },
});

const AccountSettings = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [navBarPage, setNavBarPage] = useState("Dashboard");
  const [isSelected, setIsSelected] = useState(false);

  const checkIfInMailingList = async (email) => {
    try {
      const res = await fetch(
        `/api/mailing-list?email=${encodeURIComponent(email)}`
      );
      const data = await res.json();
      setIsSelected(data.message === "yes send mails");
    } catch (error) {
      console.error("Error checking mailing list:", error);
      setIsSelected(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
    if (session?.user?.email) {
      checkIfInMailingList(session.user.email);
    }
  }, [status, router, session]);

  const handleToggle = async () => {

    try {
      const email = session?.user?.email;
      if (!email) return;

      if (!isSelected) {
        // If user was in the exclude mailing list, send a delete request
        const deleteRes = await fetch(
          `/api/mailing-list?email=${encodeURIComponent(email)}`,
          {
            method: "DELETE",
          }
        );
        const deleteData = await deleteRes.json();
        alert(deleteData.message);

      } else {
        // If user was not in the exclude mailing list, send a post request
        const postRes = await fetch("/api/mailing-list", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });
        const postData = await postRes.json();
        alert(postData.message);
      }
    } catch (error) {
      alert("Error in updating your mail preference. Please try again, if the issue persists, contact TimeTable Division.");
    } finally {
      window.location.reload();
    }
  };

  const {
    children,
    isFocusVisible,
    getBaseProps,
    getLabelProps,
    getInputProps,
  } = useCheckbox({
    defaultSelected: isSelected,
  });

  const styles = checkbox({ isSelected, isFocusVisible });

  return (
    <div>
      <Navbar session={session} setNavBarPage={setNavBarPage} />
      <div className="items-center flex flex-col my-6">
        <h1>Account Settings</h1>
        <div className="items-center my-6">
          <Card className="sm:w-full items-center text-center md:w-1/5 lg:w-1/5">
            <CardBody className="flex flex-row">
              <p className="px-10">Enable Notifications: &nbsp;&nbsp;</p>
              <label {...getBaseProps()}>
                <VisuallyHidden>
                  <input {...getInputProps()} />
                </VisuallyHidden>
                <Chip
                  classNames={{
                    base: styles.base(),
                    content: styles.content(),
                  }}
                  color="primary"
                  startContent={
                    isSelected ? <CheckIcon className="ml-1" /> : null
                  }
                  variant="faded"
                  {...getLabelProps()}
                  onClick={handleToggle}
                >
                  {children ? children : isSelected ? "Enabled" : "Disabled"}
                </Chip>
              </label>
            </CardBody>
            <CardFooter className="flex flex-col">
              <p className="text-small font-light text-gray-200 italic">
                Turn on to receive email notifications of updates
              </p>
            </CardFooter>
          </Card>

          <Card className="w-3/4 my-6 items-center text-center flex flex-col">
            <CardHeader>
              <CheckboxGroup
                label="Notification Settings (Coming Soon...)"
                // value={selectedOptions}
                // onChange={handleCheckboxChange}
                className="w-"
              ></CheckboxGroup>
              <CardBody>
                <p className="text-small font-light text-gray-200 italic">
                  Select the type of notifications you would like to receive
                </p>

                <Checkbox value="New Requests">New Requests</Checkbox>
                <Checkbox value="Status Updates">Status Updates</Checkbox>
                <Checkbox value="New Comments">New Comments</Checkbox>
              </CardBody>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
