"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FaEye,
  FaEyeSlash,
  FaEdit,
  FaCheck,
  FaArrowLeft,
} from "react-icons/fa";

import {
  enableDisableQuestionQuery,
  getAllQuestionQuery,
  getQuestionsByIDQuery,
} from "@/query/question.query";

import parse from "html-react-parser";
import { useAuth } from "@/contexts/auth.context";
import Modal from "@/components/modal";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { isPermissioned } from "@/util/auth";
import { fetchMe } from "@/query/user.query";
import { roles } from "@/util/role";

export default function Preview() {
  const router = useRouter();

  const { questionID } = useParams();

  const [question, setQuestion] = useState<{
    question_id: string;
    question: string;
    skill: { skill_id: number; skill_name: string };
    options: { option_id: number; option_text: string; is_correct: number }[];
    is_available: number;
    is_report: number;
  }>();

  const [isDisabled, setIsDisabled] = useState<boolean>();

  useEffect(() => {
    const getQuestionByID = async () => {
      try {
        const question = await getQuestionsByIDQuery(String(questionID));
        setQuestion(question);
        setIsDisabled(question?.is_available);
      } catch (error) {
        console.log("Error fetching question detail:", error);
      }
    };

    getQuestionByID();
  }, []);

  const [isEditMode, setIsEditMode] = useState(false);

  const numberToLetter = (num: any) => {
    const letters = "abcdefghijklmnopqrstuvwxyz";
    return letters[num];
  };

  const toggleDisable = () => {
    setIsDisabled(!isDisabled);
    enableDisableQuestionQuery(questionID);
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  //----------------
  // AUTH
  //----------------
  const [user, setUser] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [openUnauthorizeModal, setOpenUnauthorizeModal] = useState(false);

  useEffect(() => {
    console.log("fetch user");
    const fetchUserData = async () => {
      try {
        const response = await fetchMe();
        setUser(response);
        setIsFetching(false);
      } catch (error) {
        console.log("Error fetching user:", error);
        setUser(null);
        setIsFetching(false);
      }
    };

    fetchUserData();
  }, []);

  const isAllowed =
    isPermissioned(user, [roles.ADMIN, roles.QUESTION_CREATOR]) && !isFetching;
  useEffect(() => {
    if (isFetching) return;

    if (!isAllowed) {
      setOpenUnauthorizeModal(true);
    }
  }, [isPermissioned, isFetching, router]);

  //----------------
  // ACCESS
  //----------------
  const [isCanAccess, setIsCanAccess] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data } = await getAllQuestionQuery({ per_page: 9999 });
        setIsCanAccess(
          data.some((q: any) => q.question_id === Number(questionID))
        );
      } catch (error) {
        console.error("Error fetching question list:", error);
      }
    };
    checkAccess();
  }, [questionID, isFetching]);

  return (
    <>
      <div className="flex justify-center items-center min-h-screen ">
        <Modal
          isOpen={openUnauthorizeModal}
          onClose={() => router.push("/profile")}
          onConfirmFetch={() => router.push("/profile")}
          icon={faXmark}
          title="Unauthorized Access"
          message="You do not have permission to access this resource."
          confirmText="Confirm"
        />
        <Modal
          isOpen={!isCanAccess}
          onClose={() => router.push("/questions")}
          onConfirmFetch={() => router.push("/questions")}
          icon={faXmark}
          title="Access Denied"
          message="You do not have permission to access this page."
          confirmText="Confirm"
        />
        {isAllowed && isCanAccess && (
          <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-2xl w-full transform transition-all hover:scale-105 duration-300 ease-in-out">
            <div className="text-lg font-semibold text-gray-800 mb-4">
              <span className="underline">Question:</span>&nbsp;
              {parse(String(question?.question))}
            </div>

            <p className="text-[15px] font-semibold text-gray-400 mb-4 italic">
              Skill: {question?.skill?.skill_name}
            </p>

            <h2 className="font-semibold text-xl text-gray-700 mb-4">
              Options:
            </h2>
            <ul className="list-inside mb-6 space-y-4">
              {question?.options.map((option, index) => (
                <li
                  key={option.option_id}
                  className={`py-2 px-4 rounded-lg transition-colors duration-300 ease-in-out ${
                    option.is_correct
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-100 text-gray-800"
                  } hover:bg-indigo-200 cursor-pointer`}
                >
                  <div className="flex items-center">
                    <span className="mr-2 font-medium">
                      {numberToLetter(index)}.
                    </span>
                    <span className="flex items-center">
                      {option.option_text}
                      {option.is_correct ? (
                        <FaCheck className="ml-2 text-green-600" />
                      ) : (
                        <div></div>
                      )}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex justify-between items-center mb-4 mt-6">
              <div className="flex space-x-4">
                <button
                  className="text-2xl text-gray-600 hover:text-indigo-600 transition duration-200"
                  onClick={() => router.push(`/questions`)}
                >
                  <FaArrowLeft />
                </button>
              </div>

              <div className="flex space-x-4 ml-auto">
                {/* ใช้ ml-auto เพื่อจัดตำแหน่งขวาสุด */}
                <button
                  onClick={toggleDisable}
                  className="text-2xl text-gray-600 hover:text-indigo-600 transition duration-200"
                >
                  {Boolean(isDisabled) ? <FaEye /> : <FaEyeSlash />}
                </button>
                <button
                  onClick={() => router.push(`/questions/${questionID}/edit`)}
                  className="text-2xl text-gray-600 hover:text-indigo-600 transition duration-200"
                >
                  <FaEdit />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
