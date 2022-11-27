import React, { useState, useEffect, useCallback, Fragment } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Image from "next/image";
import guidGenerator from "../../components/utilities/randomId";
import getSecretsForProject from "../../components/utilities/getSecretsForProject";
import pushKeys from "../../components/utilities/pushKeys";
import getWorkspaces from "../api/workspace/getWorkspaces";
import getUser from "../api/user/getUser";
import NavHeader from "../../components/navigation/NavHeader";

import DashboardInputField from "../../components/dashboard/DashboardInputField";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faMagnifyingGlass,
	faEye,
	faEyeSlash,
	faPlus,
	faFolderOpen,
	faArrowDownAZ,
	faArrowDownZA,
	faDownload,
	faEllipsis,
	faPerson,
	faPeopleGroup,
	faCheck,
	faCopy,
	faCircleInfo,
	faX,
} from "@fortawesome/free-solid-svg-icons";
import ListBox from "../../components/basic/Listbox";
import DropZone from "../../components/dashboard/DropZone";
import { Menu, Transition } from "@headlessui/react";
import getWorkspaceIntegrations from "../api/integrations/getWorkspaceIntegrations";
import BottonRightPopup from "../../components/basic/popups/BottomRightPopup";
import checkUserAction from "../api/userActions/checkUserAction";
import registerUserAction from "../api/userActions/registerUserAction";
import pushKeysIntegration from "../../components/utilities/pushKeysIntegration";
import Button from "../../components/basic/buttons/Button";
import useTranslation from "next-translate/useTranslation";

const KeyPair = ({
	keyPair,
	deleteRow,
	modifyKey,
	modifyValue,
	modifyVisibility,
	isBlurred,
}) => {
	const { t } = useTranslation();

	return (
		<div className="px-1 flex flex-col items-center ml-1">
			<div className="relative flex flex-row justify-between w-full max-w-5xl mr-auto max-h-10 my-1 items-center px-2">
				<div className="min-w-xl w-96">
					<div className="flex items-center md:px-1 rounded-lg mt-4 md:mt-0 max-h-10">
						<DashboardInputField
							onChangeHandler={modifyKey}
							type="varName"
							index={keyPair[1]}
							value={keyPair[2]}
						/>
					</div>
				</div>
				<div className="w-full min-w-5xl">
					<div className="flex min-w-7xl items-center pl-1 pr-1.5 rounded-lg mt-4 md:mt-0 max-h-10 ">
						<DashboardInputField
							onChangeHandler={modifyValue}
							type="value"
							index={keyPair[1]}
							value={keyPair[3]}
							blurred={isBlurred}
						/>
					</div>
				</div>
				<Menu as="div" className="relative inline-block text-left">
					<div>
						<Menu.Button className="inline-flex w-full justify-center rounded-md text-sm font-medium text-gray-200 rounded-md hover:bg-white/10 duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
							<div className="cursor-pointer w-9 h-9 bg-white/10 rounded-md flex flex-row justify-center items-center opacity-50 hover:opacity-100 duration-200">
								<FontAwesomeIcon
									className="text-gray-300 px-2.5 text-lg mt-0.5"
									icon={faEllipsis}
								/>
							</div>
						</Menu.Button>
					</div>
					<Transition
						as={Fragment}
						enter="transition ease-out duration-100"
						enterFrom="transform opacity-0 scale-95"
						enterTo="transform opacity-100 scale-100"
						leave="transition ease-in duration-75"
						leaveFrom="transform opacity-100 scale-100"
						leaveTo="transform opacity-0 scale-95"
					>
						<Menu.Items className="absolute right-0 mt-0.5 w-44 origin-top-right rounded-md bg-bunker border border-mineshaft-700 shadow-lg ring-1 ring-black z-20 ring-opacity-5 focus:outline-none px-1 py-1">
							<div
								onClick={() =>
									modifyVisibility(
										keyPair[4] == "personal"
											? "shared"
											: "personal",
										keyPair[1]
									)
								}
								className="relative flex justify-start items-center cursor-pointer select-none py-2 px-2 rounded-md text-gray-400 hover:bg-white/10 duration-200 hover:text-gray-200 w-full"
							>
								<FontAwesomeIcon
									className="text-lg pl-1.5 pr-3"
									icon={
										keyPair[4] == "personal"
											? faPeopleGroup
											: faPerson
									}
								/>
								<div className="text-sm">
									{keyPair[4] == "personal"
										? t("dashboard:make-shared")
										: t("dashboard:make-personal")}
								</div>
							</div>
						</Menu.Items>
					</Transition>
				</Menu>
				<div className="w-2"></div>
				<div className="opacity-50 hover:opacity-100 duration-200">
					<Button
						onButtonPressed={() => deleteRow(keyPair[0])}
						color="red"
						size="icon-sm"
						icon={faX}
					/>
				</div>
			</div>
		</div>
	);
};

const envMapping = {
	Development: "dev",
	Staging: "staging",
	Production: "prod",
	Testing: "test",
};

export default function Dashboard() {
	const [data, setData] = useState();
	const [fileState, setFileState] = useState([]);
	const [buttonReady, setButtonReady] = useState(false);
	const router = useRouter();
	const [workspaceId, setWorkspaceId] = useState("");
	const [blurred, setBlurred] = useState(true);
	const [isKeyAvailable, setIsKeyAvailable] = useState(true);
	const [env, setEnv] = useState(
		router.asPath.split("?").length == 1
			? "Development"
			: Object.keys(envMapping).includes(router.asPath.split("?")[1])
			? router.asPath.split("?")[1]
			: "Development"
	);
	const [isNew, setIsNew] = useState(false);
	const [searchKeys, setSearchKeys] = useState("");
	const [errorDragAndDrop, setErrorDragAndDrop] = useState(false);
	const [projectIdCopied, setProjectIdCopied] = useState(false);
	const [sortMethod, setSortMethod] = useState("alphabetical");
	const [checkDocsPopUpVisible, setCheckDocsPopUpVisible] = useState(false);
	const [hasUserEverPushed, setHasUserEverPushed] = useState(false);
	const { t } = useTranslation();

	// #TODO: fix save message for changing reroutes
	// const beforeRouteHandler = (url) => {
	// 	const warningText =
	// 		"Do you want to save your results bfore leaving this page?";
	// 	if (!buttonReady) return;
	// 	if (router.asPath !== url && !confirm(warningText)) {
	// 		// router.events.emit('routeChangeError');
	// 		// setData(data)
	// 		savePush();
	// 		throw `Route change to "${url}" was aborted (this error can be safely ignored).`;
	// 	} else {
	// 		setButtonReady(false);
	// 	}
	// };

	// prompt the user if they try and leave with unsaved changes
	useEffect(() => {
		const warningText =
			"Do you want to save your results before leaving this page?";
		const handleWindowClose = (e) => {
			if (!buttonReady) return;
			e.preventDefault();
			return (e.returnValue = warningText);
		};
		window.addEventListener("beforeunload", handleWindowClose);
		// router.events.on('routeChangeStart', beforeRouteHandler);
		return () => {
			window.removeEventListener("beforeunload", handleWindowClose);
			// router.events.off('routeChangeStart', beforeRouteHandler);
		};
	}, [buttonReady]);

	const reorderRows = () => {
		setSortMethod(
			sortMethod == "alphabetical" ? "-alphabetical" : "alphabetical"
		);
	};

	useEffect(async () => {
		try {
			let userWorkspaces = await getWorkspaces();
			const listWorkspaces = userWorkspaces.map(
				(workspace) => workspace._id
			);
			if (
				!listWorkspaces.includes(
					router.asPath.split("/")[2].split("?")[0]
				)
			) {
				router.push("/dashboard/" + listWorkspaces[0]);
			}

			if (env != router.asPath.split("?")[1]) {
				router.push(router.asPath.split("?")[0] + "?" + env);
			}
			setBlurred(true);
			setWorkspaceId(router.query.id);

			await getSecretsForProject({
				env,
				setFileState,
				setIsKeyAvailable,
				setData,
				workspaceId: router.query.id,
			});

			const user = await getUser();
			setIsNew(
				(Date.parse(new Date()) - Date.parse(user.createdAt)) / 60000 <
					3
					? true
					: false
			);

			let userAction = await checkUserAction({
				action: "first_time_secrets_pushed",
			});
			setHasUserEverPushed(userAction ? true : false);
		} catch (error) {
			console.log("Error", error);
			setData([]);
		}
	}, [env]);

	const addRow = () => {
		setIsNew(false);
		setData([...data, [guidGenerator(), data.length, "", "", "shared"]]);
	};

	const deleteRow = (id) => {
		setButtonReady(true);
		setData(data.filter((row) => row[0] !== id)); // filter by id
	};

	const modifyValue = (value, id) => {
		setData((oldData) => {
			oldData[id][3] = value;
			return [...oldData];
		});
		setButtonReady(true);
	};

	const modifyKey = (value, id) => {
		setData((oldData) => {
			oldData[id][2] = value;
			return [...oldData];
		});
		setButtonReady(true);
	};

	const modifyVisibility = (value, id) => {
		setData((oldData) => {
			oldData[id][4] = value;
			return [...oldData];
		});
		setButtonReady(true);
	};

	const listenChangeValue = useCallback((value, id) => {
		modifyValue(value, id);
	}, []);

	const listenChangeKey = useCallback((value, id) => {
		modifyKey(value, id);
	}, []);

	const listenChangeVisibility = useCallback((value, id) => {
		modifyVisibility(value, id);
	}, []);

	const savePush = async () => {
		let obj = Object.assign(
			{},
			...data.map((row) => ({ [row[2]]: [row[3], row[4]] }))
		);
		setButtonReady(false);
		pushKeys(obj, router.query.id, env);

		let integrations = await getWorkspaceIntegrations({
			workspaceId: router.query.id,
		});
		integrations.map(async (integration) => {
			if (
				envMapping[env] == integration.environment &&
				integration.isActive == true
			) {
				let objIntegration = Object.assign(
					{},
					...data.map((row) => ({ [row[2]]: row[3] }))
				);
				await pushKeysIntegration({
					obj: objIntegration,
					integrationId: integration._id,
				});
			}
		});

		if (!hasUserEverPushed) {
			setCheckDocsPopUpVisible(true);
			await registerUserAction({ action: "first_time_secrets_pushed" });
		}
	};

	const addData = (newData) => {
		setData(data.concat(newData));
		setButtonReady(true);
	};

	const changeBlurred = () => {
		setBlurred(!blurred);
	};

	// This function downloads the secrets as an .env file
	const download = () => {
		const file = data
			.map((item) => [item[2], item[3]].join("="))
			.join("\n");
		const blob = new Blob([file]);
		const fileDownloadUrl = URL.createObjectURL(blob);
		let alink = document.createElement("a");
		alink.href = fileDownloadUrl;
		alink.download = envMapping[env] + ".env";
		alink.click();
	};

	const deleteCertainRow = (id) => {
		deleteRow(id);
	};

	function copyToClipboard() {
		// Get the text field
		var copyText = document.getElementById("myInput");

		// Select the text field
		copyText.select();
		copyText.setSelectionRange(0, 99999); // For mobile devices

		// Copy the text inside the text field
		navigator.clipboard.writeText(copyText.value);

		setProjectIdCopied(true);
		setTimeout(() => setProjectIdCopied(false), 2000);
		// Alert the copied text
		// alert("Copied the text: " + copyText.value);
	}

	return data ? (
		<div className="bg-bunker-800 max-h-screen flex flex-col justify-between text-white">
			<Head>
				<title>Secrets</title>
				<link rel="icon" href="/infisical.ico" />
				<meta property="og:image" content="/images/message.png" />
				<meta
					property="og:title"
					content="Manage your .env files in seconds"
				/>
				<meta
					name="og:description"
					content="Infisical a simple end-to-end encrypted platform that enables teams to sync and manage their .env files."
				/>
			</Head>
			<div className="flex flex-row">
				<div className="w-full max-h-96 pb-2">
					<NavHeader pageName="Secrets" isProjectRelated={true} />
					{checkDocsPopUpVisible && (
						<BottonRightPopup
							buttonText="Check Docs"
							buttonLink="https://infisical.com/docs/getting-started/introduction"
							titleText="Good job!"
							emoji="🎉"
							textLine1="Congrats on adding more secrets."
							textLine2="Here is how to connect them to your codebase."
							setCheckDocsPopUpVisible={setCheckDocsPopUpVisible}
						/>
					)}
					<div className="flex flex-row justify-between items-center mx-6 mt-6 mb-3 text-xl max-w-5xl">
						<div className="flex flex-row justify-start items-center text-3xl">
							<p className="font-semibold mr-4 mt-1">Secrets</p>
							{data?.length == 0 && (
								<ListBox
									selected={env}
									data={[
										"Development",
										"Staging",
										"Production",
										"Testing",
									]}
									// ref={useRef(123)}
									onChange={setEnv}
									className="z-40"
								/>
							)}
						</div>
						<div className="flex flex-row">
							<div className="flex justify-end items-center bg-white/[0.07] text-base mt-2 mr-2 rounded-md text-gray-400">
								<p className="mr-2 font-bold pl-4">{`${t(
									"common:project-id"
								)}:`}</p>
								<input
									type="text"
									value={workspaceId}
									id="myInput"
									className="bg-white/0 text-gray-400 py-2 w-60 px-2 min-w-md outline-none"
									disabled
								></input>
								<div className="group font-normal group relative inline-block text-gray-400 underline hover:text-primary duration-200">
									<button
										onClick={copyToClipboard}
										className="pl-4 pr-4 border-l border-white/20 py-2 hover:bg-white/[0.12] duration-200"
									>
										{projectIdCopied ? (
											<FontAwesomeIcon
												icon={faCheck}
												className="pr-0.5"
											/>
										) : (
											<FontAwesomeIcon icon={faCopy} />
										)}
									</button>
									<span className="absolute hidden group-hover:flex group-hover:animate-popup duration-300 w-28 -left-8 -top-20 translate-y-full pl-3 py-2 bg-white/10 rounded-md text-center text-gray-400 text-sm">
										{t("common:click-to-copy")}
									</span>
								</div>
							</div>
							{(data?.length !== 0 || buttonReady) && (
								<div
									className={`flex justify-start max-w-sm mt-2`}
								>
									<Button
										text={t("save-changes")}
										onButtonPressed={savePush}
										color="primary"
										size="md"
										active={buttonReady}
										iconDisabled={faCheck}
										textDisabled="Saved"
									/>
								</div>
							)}
						</div>
					</div>
					<div className="mx-6 w-full pr-12">
						<div className="flex flex-col max-w-5xl pb-1">
							<div className="w-full flex flex-row items-start">
								{data?.length !== 0 && (
									<>
										<ListBox
											selected={env}
											data={[
												"Development",
												"Staging",
												"Production",
												"Testing",
											]}
											// ref={useRef(123)}
											onChange={setEnv}
											className="z-40"
										/>
										<div className="h-10 w-full bg-white/5 hover:bg-white/10 ml-2 flex items-center rounded-md flex flex-row items-center">
											<FontAwesomeIcon
												className="bg-white/5 rounded-l-md py-3 pl-4 pr-2 text-gray-400"
												icon={faMagnifyingGlass}
											/>
											<input
												className="pl-2 text-gray-400 rounded-r-md bg-white/5 w-full h-full outline-none"
												value={searchKeys}
												onChange={(e) =>
													setSearchKeys(
														e.target.value
													)
												}
												placeholder={t(
													"dashboard:search-keys"
												)}
											/>
										</div>
										<div className="ml-2 min-w-max flex flex-row items-start justify-start">
											<Button
												onButtonPressed={reorderRows}
												color="mineshaft"
												size="icon-md"
												icon={
													sortMethod == "alphabetical"
														? faArrowDownAZ
														: faArrowDownZA
												}
											/>
										</div>
										<div className="ml-2 min-w-max flex flex-row items-start justify-start">
											<Button
												onButtonPressed={download}
												color="mineshaft"
												size="icon-md"
												icon={faDownload}
											/>
										</div>
										<div className="ml-2 min-w-max flex flex-row items-start justify-start">
											<Button
												onButtonPressed={changeBlurred}
												color="mineshaft"
												size="icon-md"
												icon={
													blurred ? faEye : faEyeSlash
												}
											/>
										</div>
										<div className="relative ml-2 min-w-max flex flex-row items-start justify-end">
											<Button
												text={t("dashboard:add-key")}
												onButtonPressed={addRow}
												color="mineshaft"
												icon={faPlus}
												size="md"
											/>
											{isNew && (
												<span className="absolute right-0 flex h-3 w-3 items-center justify-center ml-4 mb-4">
													<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/50 opacity-75 h-4 w-4"></span>
													<span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
												</span>
											)}
										</div>
									</>
								)}
							</div>
						</div>
						{data?.length !== 0 ? (
							<div
								id="dataall"
								className="flex flex-col max-h-40 grow max-h-[calc(100vh-240px)] w-full overflow-y-scroll no-scrollbar no-scrollbar::-webkit-scrollbar"
							>
								<div
									className={`bg-white/5 mt-1 mb-1 rounded-md pb-2 max-w-5xl overflow-visible`}
								>
									<div className="rounded-t-md sticky top-0 z-20 bg-bunker flex flex-row pl-4 pr-6 pt-4 pb-2 items-center justify-between text-gray-300 font-bold">
										{/* <FontAwesomeIcon icon={faAngleDown} /> */}
										<div className="flex flex-row items-center">
											<p className="pl-2 text-lg">
												{t("dashboard:personal")}
											</p>
											<div className="group font-normal group relative inline-block text-gray-300 underline hover:text-primary duration-200">
												<FontAwesomeIcon
													className="ml-3 mt-1 text-lg"
													icon={faCircleInfo}
												/>
												<span className="absolute hidden group-hover:flex group-hover:animate-popdown duration-300 w-44 -left-16 -top-7 translate-y-full px-2 py-2 bg-gray-700 rounded-md text-center text-gray-100 text-sm after:content-[''] after:absolute after:left-1/2 after:bottom-[100%] after:-translate-x-1/2 after:border-8 after:border-x-transparent after:border-t-transparent after:border-b-gray-700">
													{t(
														"dashboard:personal-description"
													)}
												</span>
											</div>
										</div>
									</div>
									<div id="data1" className="">
										{data
											.filter(
												(keyPair) =>
													keyPair[2]
														.toLowerCase()
														.includes(
															searchKeys.toLowerCase()
														) &&
													keyPair[4] == "personal"
											)
											.sort((a, b) =>
												sortMethod == "alphabetical"
													? a[2].localeCompare(b[2])
													: b[2].localeCompare(a[2])
											)
											?.map((keyPair, index) => (
												<KeyPair
													key={keyPair[0]}
													keyPair={keyPair}
													deleteRow={deleteCertainRow}
													modifyValue={
														listenChangeValue
													}
													modifyKey={listenChangeKey}
													modifyVisibility={
														listenChangeVisibility
													}
													isBlurred={blurred}
												/>
											))}
									</div>
								</div>
								<div
									className={`bg-white/5 mt-1 mb-2 rounded-md p-1 pb-2 max-w-5xl ${
										data?.length > 8 ? "h-3/4" : "h-min"
									}`}
								>
									<div className="sticky top-0 z-10 bg-bunker flex flex-row pl-4 pr-5 pt-4 pb-2 items-center justify-between text-gray-300 font-bold">
										{/* <FontAwesomeIcon icon={faAngleDown} /> */}
										<div className="flex flex-row items-center">
											<p className="pl-2 text-lg">
												{t("dashboard:shared")}
											</p>
											<div className="group font-normal group relative inline-block text-gray-300 underline hover:text-primary duration-200">
												<FontAwesomeIcon
													className="ml-3 text-lg mt-1"
													icon={faCircleInfo}
												/>
												<span className="absolute hidden group-hover:flex group-hover:animate-popdown duration-300 w-44 -left-16 -top-7 translate-y-full px-2 py-2 bg-gray-700 rounded-md text-center text-gray-100 text-sm after:content-[''] after:absolute after:left-1/2 after:bottom-[100%] after:-translate-x-1/2 after:border-8 after:border-x-transparent after:border-t-transparent after:border-b-gray-700">
													{t(
														"dashboard:shared-description"
													)}
												</span>
											</div>
										</div>
									</div>
									<div id="data2" className="data2">
										{data
											.filter(
												(keyPair) =>
													keyPair[2]
														.toLowerCase()
														.includes(
															searchKeys.toLowerCase()
														) &&
													keyPair[4] == "shared"
											)
											.sort((a, b) =>
												sortMethod == "alphabetical"
													? a[2].localeCompare(b[2])
													: b[2].localeCompare(a[2])
											)
											?.map((keyPair, index) => (
												<KeyPair
													key={keyPair[0]}
													keyPair={keyPair}
													deleteRow={deleteCertainRow}
													modifyValue={
														listenChangeValue
													}
													modifyKey={listenChangeKey}
													modifyVisibility={
														listenChangeVisibility
													}
													isBlurred={blurred}
												/>
											))}
									</div>
								</div>
								<div className="w-full max-w-5xl">
									<DropZone
										setData={addData}
										setErrorDragAndDrop={
											setErrorDragAndDrop
										}
										createNewFile={addRow}
										errorDragAndDrop={errorDragAndDrop}
										setButtonReady={setButtonReady}
										keysExist={true}
										numCurrentRows={data.length}
									/>
								</div>
							</div>
						) : (
							<div className="flex flex-col items-center justify-center h-full text-xl text-gray-400 max-w-5xl mt-28">
								{fileState.message !=
									"There's nothing to pull" &&
									fileState.message != undefined && (
										<FontAwesomeIcon
											className="text-7xl mb-8"
											icon={faFolderOpen}
										/>
									)}
								{(fileState.message ==
									"There's nothing to pull" ||
									fileState.message == undefined) &&
									isKeyAvailable && (
										<DropZone
											setData={setData}
											setErrorDragAndDrop={
												setErrorDragAndDrop
											}
											createNewFile={addRow}
											errorDragAndDrop={errorDragAndDrop}
											setButtonReady={setButtonReady}
											numCurrentRows={data.length}
										/>
									)}
								{fileState.message ==
									"Failed membership validation for workspace" && (
									<p>
										You are not authorized to view this
										project.
									</p>
								)}
								{fileState.message ==
									"Access needed to pull the latest file" ||
									(!isKeyAvailable && (
										<>
											<FontAwesomeIcon
												className="text-7xl mt-20 mb-8"
												icon={faFolderOpen}
											/>
											<p>
												To view this file, contact your
												administrator for permission.
											</p>
											<p className="mt-1">
												They need to grant you access in
												the team tab.
											</p>
										</>
									))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	) : (
		<div className="relative z-10 w-10/12 mr-auto h-full ml-2 bg-bunker-800 flex flex-col items-center justify-center">
			<div className="absolute top-0 bg-bunker h-14 border-b border-mineshaft-700 w-full"></div>
			<Image
				src="/images/loading/loading.gif"
				height={70}
				width={120}
				alt="loading animation"
			></Image>
		</div>
	);
}

Dashboard.requireAuth = true;
