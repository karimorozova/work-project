const apiUrl = require("../helpers/apiurl")
const jwt = require('jsonwebtoken')
const { secretKey } = require('../configs')
const { returnIconCurrencyByStringCode } = require('../helpers/commonFunctions')

function applicationMessage(obj) {
	let cvFiles = ""
	let languagePairs = ""
	let software = ""
	let industries = ""
	let coverLetterFiles = ""
	let educations = ""
	let positions = ""
	if (obj.cvFiles.length) {
		cvFiles = obj.cvFiles.reduce((acc, cur, index) => {
			return acc + `<a href="${ apiUrl }${ cur }" download target='_self'>cvFile${ index + 1 }</a>; `
		}, "")
	}
	if (obj.coverLetterFiles.length) {
		coverLetterFiles = obj.coverLetterFiles.reduce((acc, cur, index) => {
			return acc + `<a href="${ apiUrl }${ cur }" download target='_self'>coverLetterFile${ index + 1 }</a>; `
		}, "")
	}
	if (obj.languagePairs) {
		languagePairs = obj.languagePairs.reduce((acc, cur) => {
			return acc + cur.source + ' >> ' + cur.target + "; "
		}, "")
	}
	if (obj.industries) {
		industries = obj.industries.reduce((acc, cur) => {
			return acc + cur.name + "; "
		}, "")
	}
	if (obj.positions) {
		positions = obj.positions.reduce((acc, cur) => {
			return acc + cur + "; "
		}, "")
	}
	if (obj.technicalComp.softwares) {
		software = obj.technicalComp.softwares.reduce((acc, cur) => {
			return acc + cur + "; "
		}, "")
	}
	if (obj.educations) {
		educations = obj.educations.reduce((acc, cur) => {
			return acc + `${ cur.study }/${ cur.field }/${ cur.institute }/${ cur.grade } <br>`
		}, "")
	}
	return `<div class="main" style="font-weight:400;font-size:12px;border-width:1px;border-style:solid;border-color:#66563E;max-width:700px;display:flex;flex-direction:column;padding-top:10px;padding-bottom:10px;padding-right:10px;padding-left:10px;" >
    <h2 class="head-title" style="font-size:18px;align-self:center;" >New Application Request</h1>
        <div class="personal">
            <ul>
                <li style="margin-bottom:5px;" >Name: ${ obj.firstName }</li>
                <li style="margin-bottom:5px;" >Surname: ${ obj.surname }</li>
                <li style="margin-bottom:5px;" >Email: ${ obj.email }</li>
                <li style="margin-bottom:5px;" >Phone Number: ${ obj.phone }</li>
                <li style="margin-bottom:5px;" >Mother tongue: ${ obj.native }</li>
                <li style="margin-bottom:5px;" >Time-zone: ${ obj.timezone }</li>
                <li style="margin-bottom:5px;" >Language Pairs: ${ languagePairs }</li>
                <li style="margin-bottom:5px;" >CV: ${ cvFiles }</li>
                <li style="margin-bottom:5px;" >Position: ${ positions }</li>
            </ul>
        </div>
        <div class="education">
            <ul>
                <li style="margin-bottom:5px;" >Education:
                    <div>
                        ${ educations }
                    </div>
                </li>
            </ul>
        </div>
        <div class="transExp">
            <ul>
                <li style="margin-bottom:5px;" >Transaltion Experience: <span>${ obj.experienceYears }</span></li>
            </ul>
        </div>
        <div class="tech">
            <ul>
                <li style="margin-bottom:5px;" >Internet Access: ${ obj.technicalComp.internet }</li>
                <li style="margin-bottom:5px;" >CAT experience: ${ obj.technicalComp.cat }</li>
                <li style="margin-bottom:5px;" >Software experience: ${ software }</li>
            </ul>
        </div>
        <div class="industries">
            <ul>
                <li style="margin-bottom:5px;" >Industries: ${ industries }</li>
            </ul>
        </div>
        <div class="other">
            <ul>
                <li style="margin-bottom:5px;" >Availability: ${ obj.availability }</li>
                <li style="margin-bottom:5px;" >Willing to take a test: ${ obj.testAgree }</li>
                <li style="margin-bottom:5px;" >Rate: ${ obj.basicRate }</li>
                <li style="margin-bottom:5px;" >Cover Letter: ${ obj.coverLetter }</li>
                <li style="margin-bottom:5px;" >Cover Letter (files): ${ coverLetterFiles }</li>
            </ul>
        </div>
    </div>`
}

function requestMessageForVendor(obj) {
	const date = Date.now()
	const langPair = obj.sourceLanguage ? `${ obj.sourceLanguage } >> ${ obj.targetLanguage }; ` : `${ obj.targetLanguage } / ${ obj.packageSize }; `
	const token = jwt.sign({ vendorId: obj.vendor.id }, secretKey, { expiresIn: '24h' })
	const stepId = obj.stepId.replace(/ /g, '%20')
	const acceptQuote = '<a href=' + `${ apiUrl }/projectsapi/pangea-re-survey-page-step-decision?decision=accept&vendorId=${ obj.vendor.id }&projectId=${ obj.projectId }&stepId=${ stepId }&to=${ date }&t=${ token }` + ` target="_blank" style="color: #D15F46;">I accept - ${ obj.name }, ${ (obj.nativeFinance.Price.payables).toFixed(2) } ${ returnIconCurrencyByStringCode('EUR') }</a>`
	const declineQuote = '<a href=' + `${ apiUrl }/projectsapi/pangea-re-survey-page-step-decision?decision=decline&vendorId=${ obj.vendor.id }&projectId=${ obj.projectId }&stepId=${ stepId }&to=${ date }&t=${ token }` + ` target="_blank" style="color: #D15F46;">I reject - ${ obj.name }, ${ (obj.nativeFinance.Price.payables).toFixed(2) } ${ returnIconCurrencyByStringCode('EUR') }</a>`
	const start = obj.start.split('T')[0].split('-').reverse().join('-')
	const deadline = obj.deadline.split('T')[0].split('-').reverse().join('-')
	return `<div class="wrapper" style="width:800px;border-width:1px;border-style:solid;border-color:rgb(129, 129, 129);font-family:'Roboto', sans-serif;color:#66563E;box-sizing:border-box;" >
                <header style="background-color:#66563E;text-align:center;" >
                    <img class="logo" src="cid:logo@pan" alt="pangea" style="margin-top:20px;margin-bottom:20px;margin-right:0;margin-left:0;" >
                </header>
                <div class="main" style="padding-top:40px;padding-bottom:40px;padding-right:40px;padding-left:40px;" >
                    <p style="background: #F4F0EE; font-size: 14px; font-weight: bold; padding: 14px;"><span id="client-name-row">Dear ${ obj.vendor.firstName }</span></p>
                    <p>
                        Step ${ obj.stepId } ${ obj.serviceStep.title } has been assigned to you.
                    </p>
                    <p style="font-weight: 400;">
                        Here are the needed details:
                    </p>
                    <div class="details" style="width:95%;margin-top:0;margin-bottom:0;margin-right:auto;margin-left:auto;" >
                        <table class="details__table" style="color:#66563E;border-width:1px;border-style:solid;border-color:#66563E;border-collapse:collapse;" >
                            <tr>
                                <td class="main_weight600" style="background:#F4F0EE;padding-top:5px;padding-bottom:5px;padding-right:5px;padding-left:5px;min-width:200px;font-weight:600;" >ID:</td>
                                <td style="font-weight: 400;background:#F4F0EE;padding-top:5px;padding-bottom:5px;padding-right:5px;padding-left:5px;min-width:200px;" >${ obj.stepId }</td>
                            </tr>
                            <tr>
                                <td class="main_weight600" style="padding-top:5px;padding-bottom:5px;padding-right:5px;padding-left:5px;min-width:200px;font-weight:600;" >Work type:</td>
                                <td style="font-weight: 400;padding-top:5px;padding-bottom:5px;padding-right:5px;padding-left:5px;min-width:200px;" >${ obj.serviceStep.title }</td>
                            </tr>
                            <tr>
                                <td class="main_weight600" style="background:#F4F0EE;padding-top:5px;padding-bottom:5px;padding-right:5px;padding-left:5px;min-width:200px;font-weight:600;" >Language:</td>
                                <td style="font-weight: 400;background:#F4F0EE;padding-top:5px;padding-bottom:5px;padding-right:5px;padding-left:5px;min-width:200px;" >${ langPair }</td>
                            </tr>
                            <tr>
                                <td class="main_weight600" style="padding-top:5px;padding-bottom:5px;padding-right:5px;padding-left:5px;min-width:200px;font-weight:600;" >Industry:</td>
                                <td style="font-weight: 400;padding-top:5px;padding-bottom:5px;padding-right:5px;padding-left:5px;min-width:200px;" >${ obj.industry }</td>
                            </tr>
                            <tr>
                                <td class="main_weight600" style="background:#F4F0EE;padding-top:5px;padding-bottom:5px;padding-right:5px;padding-left:5px;min-width:200px;font-weight:600;" >Wordcount:</td>
                                <td style="font-weight: 400;background:#F4F0EE;padding-top:5px;padding-bottom:5px;padding-right:5px;padding-left:5px;min-width:200px;" >${ obj.nativeFinance.Wordcount.payables || '-' }</td>
                            </tr>
                            <tr>
                                <td class="main_weight600" style="padding-top:5px;padding-bottom:5px;padding-right:5px;padding-left:5px;min-width:200px;font-weight:600;" >Deadline:</td>
                                <td style="font-weight: 400;padding-top:5px;padding-bottom:5px;padding-right:5px;padding-left:5px;min-width:200px;" >${ deadline }</td>
                            </tr>
                            <tr>
                             <td class="main_weight600" style="background:#F4F0EE;padding-top:5px;padding-bottom:5px;padding-right:5px;padding-left:5px;min-width:200px;font-weight:600;" >Cost:</td>
                             <td style="font-weight: 400;background:#F4F0EE;padding-top:5px;padding-bottom:5px;padding-right:5px;padding-left:5px;min-width:200px;" >${ (obj.nativeFinance.Price.payables).toFixed(2) } ${ returnIconCurrencyByStringCode('EUR') }</td>
                            </tr>
                        </table>
                    </div>
                    <p class="main_weight600 main_line15" style="font-weight:600;line-height:1.5;" >
                        By clicking on one of the links below, you can accept or reject the job.
                    </p>
                    <p style="font-weight: 400;">
                        You can accept the quote by clicking the link below:  
                    </p>
                    
                    <span style="font-weight: 400;">I accept - ${ acceptQuote }</span>
                    <p style="font-weight: 400;">or</p>
                    <span style="font-weight: 400;">I reject - ${ declineQuote }</span>
                    
                </div>
                <footer>
                    <hr size="15" color="#66563E">
                    <a class="footer__link" href="https://www.pangea.global" style="display:block;width:100%;text-align:center;padding-top:10px;padding-bottom:15px;padding-right:0;padding-left:0;text-decoration:none;color:#66563E;" >www.pangea.global</a>
                </footer>
            </div>`
}

function stepCancelledMessage(obj) {
	return `<div class="wrapper" style="width:800px;border-width:1px;border-style:solid;border-color:rgb(129, 129, 129);font-family:'Roboto', sans-serif;color:#66563E;box-sizing:border-box;" >
                <header style="background-color:#66563E;text-align:center;" >
                    <img class="logo" src="cid:logo@pan" alt="pangea" style="margin-top:20px;margin-bottom:20px;margin-right:0;margin-left:0;" >
                </header>
                <div class="main" style="padding-top:40px;padding-bottom:40px;padding-right:40px;padding-left:40px;" >
                    <p style="background: #F4F0EE; font-size: 14px; font-weight: bold; padding: 14px;"><span id="client-name-row">Dear ${ obj.vendor.firstName }</span></p>
                    <p style="font-weight: 400;">
                        We would like to information you that step: ${ obj.stepId } ${ obj.serviceStep.title } has been cancelled.
                    </p>
                </div>
                <footer>
                    <hr size="15" color="#66563E">
                    <a class="footer__link" href="https://www.pangea.global" style="display:block;width:100%;text-align:center;padding-top:10px;padding-bottom:15px;padding-right:0;padding-left:0;text-decoration:none;color:#66563E;" >www.pangea.global</a>
                </footer>
            </div>`
}

function stepMiddleCancelledMessage(obj) {
	const fee = obj.status === "Completed" ? obj.nativeFinance.Price.payables : obj.nativeFinance.Price.halfPayables
	return `<div class="wrapper" style="width:800px;border-width:1px;border-style:solid;border-color:rgb(129, 129, 129);font-family:'Roboto', sans-serif;color:#66563E;box-sizing:border-box;" >
                <header style="background-color:#66563E;text-align:center;" >
                    <img class="logo" src="cid:logo@pan" alt="pangea" style="margin-top:20px;margin-bottom:20px;margin-right:0;margin-left:0;" >
                </header>
                <div class="main" style="padding-top:40px;padding-bottom:40px;padding-right:40px;padding-left:40px;" >
                    <p style="background: #F4F0EE; font-size: 14px; font-weight: bold; padding: 14px;"><span id="client-name-row">Dear ${ obj.vendor.firstName }</span></p>
                    <p style="font-weight: 400;">
                        We would like to inform you that step: ${ obj.stepId } ${ obj.serviceStep.title } has been cancelled in the middle.
                    </p>
                    <p style="font-weight: 400;">
                        You will be paid ${ fee || obj.nativeFinance.Price.payables || 0 } ${ returnIconCurrencyByStringCode('EUR') } which is according to relative work you have completed.
                    </p>
                </div>
                <footer>
                    <hr size="15" color="#66563E">
                    <a class="footer__link" href="https://www.pangea.global" style="display:block;width:100%;text-align:center;padding-top:10px;padding-bottom:15px;padding-right:0;padding-left:0;text-decoration:none;color:#66563E;" >www.pangea.global</a>
                </footer>
            </div>`
}

function vendorReassignmentMessage(obj, reason) {
	return `<div class="wrapper" style="width:800px;border-width:1px;border-style:solid;border-color:rgb(129, 129, 129);font-family:'Roboto', sans-serif;color:#66563E;box-sizing:border-box;" >
                <header style="background-color:#66563E;text-align:center;" >
                    <img class="logo" src="cid:logo@pan" alt="pangea" style="margin-top:20px;margin-bottom:20px;margin-right:0;margin-left:0;" >
                </header>
                <div class="main" style="padding-top:40px;padding-bottom:40px;padding-right:40px;padding-left:40px;" >
                    <p style="background: #F4F0EE; font-size: 14px; font-weight: bold; padding: 14px;"><span id="client-name-row">Dear ${ obj.vendor.firstName }</span></p>
                    <p style="font-weight: 400;">
                        We would like to update you that ${ obj.stepId } ${ obj.serviceStep.title } has been reassigned to a different vendor. 
                    </p>
                </div>
                <footer>
                    <hr size="15" color="#66563E">
                    <a class="footer__link" href="https://www.pangea.global" style="display:block;width:100%;text-align:center;padding-top:10px;padding-bottom:15px;padding-right:0;padding-left:0;text-decoration:none;color:#66563E;" >www.pangea.global</a>
                </footer>
            </div>`
}

function vendorMiddleReassignmentMessage(allUnits, obj, reason, isPay) {
	const { type } = allUnits.find(({ _id }) => _id.toString() === obj.serviceStep.unit.toString())
	const progress = type === "CAT Wordcount" ?
			(obj.progress.wordsDone / obj.progress.totalWordCount * 100).toFixed(2) :
			obj.progress
	const fee = obj.nativeFinance.Price.halfPayables ? obj.nativeFinance.Price.halfPayables : obj.nativeFinance.Price.payables
	const payText = isPay ?
			`<p style="font-weight: 400;">You will be paid according to your partial completion of the step.</p>
        <p style="font-weight: 400;">You have completed ${ progress } % of the task and your fee for this step is: ${ fee } ${ returnIconCurrencyByStringCode('EUR') }</p>`
			: ""
	return `<div class="wrapper" style="width:800px;border-width:1px;border-style:solid;border-color:rgb(129, 129, 129);font-family:'Roboto', sans-serif;color:#66563E;box-sizing:border-box;" >
                <header style="background-color:#66563E;text-align:center;" >
                    <img class="logo" src="cid:logo@pan" alt="pangea" style="margin-top:20px;margin-bottom:20px;margin-right:0;margin-left:0;" >
                </header>
                <div class="main" style="padding-top:40px;padding-bottom:40px;padding-right:40px;padding-left:40px;" >
                    <p style="background: #F4F0EE; font-size: 14px; font-weight: bold; padding: 14px;"><span id="client-name-row">Dear ${ obj.vendor.firstName }</span></p>
                    <p style="font-weight: 400;">
                        Step ${ obj.stepId } (${ obj.serviceStep.title }) has been reassigned to another vendor.
                    </p>
                    <p style="font-weight: 400;">Reason: ${ reason }</p>
                    <p style="font-weight: 400;">
                        ${ payText }
                    </p>
                </div>
                <footer>
                    <hr size="15" color="#66563E">
                    <a class="footer__link" href="https://www.pangea.global" style="display:block;width:100%;text-align:center;padding-top:10px;padding-bottom:15px;padding-right:0;padding-left:0;text-decoration:none;color:#66563E;" >www.pangea.global</a>
                </footer>
            </div>`
}

function vendorMiddleAssignmentMessage(obj) {
	const mainMessage = obj.isStart ?
			"Although someone else has worked on this step, you shall start the task from the beginning."
			: "You should continue your work from the place it has been stopped."
	return `<div class="wrapper" style="width:800px;border-width:1px;border-style:solid;border-color:rgb(129, 129, 129);font-family:'Roboto', sans-serif;color:#66563E;box-sizing:border-box;" >
                <header style="background-color:#66563E;text-align:center;" >
                    <img class="logo" src="cid:logo@pan" alt="pangea" style="margin-top:20px;margin-bottom:20px;margin-right:0;margin-left:0;" >
                </header>
                <div class="main" style="padding-top:40px;padding-bottom:40px;padding-right:40px;padding-left:40px;" >
                    <p style="background: #F4F0EE; font-size: 14px; font-weight: bold; padding: 14px;"><span id="client-name-row">Dear ${ obj.step.vendor.firstName }</span></p>
                    <p style="font-weight: 400;">
                        Step: ${ obj.step.stepId } has been reassigned to you. 
                    </p>
                    <p style="font-weight: 400;">
                        ${ mainMessage }
                    </p>
                    <p style="font-weight: 400;">An availability email with all the details of the project will be sent to you shortly.</p>
                </div>
                <footer>
                    <hr size="15" color="#66563E">
                    <a class="footer__link" href="https://www.pangea.global" style="display:block;width:100%;text-align:center;padding-top:10px;padding-bottom:15px;padding-right:0;padding-left:0;text-decoration:none;color:#66563E;" >www.pangea.global</a>
                </footer>
            </div>`
}

function stepReopenedMessage(obj) {
	const reason = obj.reason ? `<p style="font-weight: 400;">Reason: ${ obj.reason }</p>` : ""
	return `<div class="wrapper" style="width:800px;border-width:1px;border-style:solid;border-color:rgb(129, 129, 129);font-family:'Roboto', sans-serif;color:#66563E;box-sizing:border-box;" >
                <header style="background-color:#66563E;text-align:center;" >
                    <img class="logo" src="cid:logo@pan" alt="pangea" style="margin-top:20px;margin-bottom:20px;margin-right:0;margin-left:0;" >
                </header>
                <div class="main" style="padding-top:40px;padding-bottom:40px;padding-right:40px;padding-left:40px;" >
                    <p style="background: #F4F0EE; font-size: 14px; font-weight: bold; padding: 14px;"><span id="client-name-row">Dear ${ obj.vendor.firstName }</span></p>
                    <p style="font-weight: 400;">
                         Step: ${ obj.stepId } ${ obj.serviceStep.title } has been reopened.
                    </p>
                    ${ reason }
                </div>
                <footer>
                    <hr size="15" color="#66563E">
                    <a class="footer__link" href="https://www.pangea.global" style="display:block;width:100%;text-align:center;padding-top:10px;padding-bottom:15px;padding-right:0;padding-left:0;text-decoration:none;color:#66563E;" >www.pangea.global</a>
                </footer>
            </div>`
}

function stepReadyToStartMessage(obj) {
	return `<div class="wrapper" style="width:800px;border-width:1px;border-style:solid;border-color:rgb(129, 129, 129);font-family:'Roboto', sans-serif;color:#66563E;box-sizing:border-box;" >
                <header style="background-color:#66563E;text-align:center;" >
                    <img class="logo" src="cid:logo@pan" alt="pangea" style="margin-top:20px;margin-bottom:20px;margin-right:0;margin-left:0;" >
                </header>
                <div class="main" style="padding-top:40px;padding-bottom:40px;padding-right:40px;padding-left:40px;" >
                    <p style="background: #F4F0EE; font-size: 14px; font-weight: bold; padding: 14px;"><span id="client-name-row">Hello ${ obj.step.vendor.firstName }</span></p>
                    <p style="font-weight: 400;">
                        Step ${ obj.step.stepId }: ${ obj.project.projectName } is now ready to start.
                    </p>
                    <p style="font-weight: 400;">
                        You can access the system or click on the link below and enter the task directly.
                    </p>
                    <p style="font-weight: 400;">
                        <a style="color: #D15F46;" href="https://vendor.pangea.global/dashboard/" target="_blank">Open job: ${ obj.step.stepId }: ${ obj.project.projectName }</a>
                    </p>
                </div>
                <footer>
                    <hr size="15" color="#66563E">
                    <a class="footer__link" href="https://www.pangea.global" style="display:block;width:100%;text-align:center;padding-top:10px;padding-bottom:15px;padding-right:0;padding-left:0;text-decoration:none;color:#66563E;" >www.pangea.global</a>
                </footer>
            </div>`
}

function sendMemoqCredentials(obj) {
	return `<div class="wrapper" style="width:800px;border-width:1px;border-style:solid;border-color:rgb(129, 129, 129);font-family:'Roboto', sans-serif;color:#66563E;box-sizing:border-box;" >
                <header style="background-color:#66563E;text-align:center;" >
                    <img class="logo" src="cid:logo@pan" alt="pangea" style="margin-top:20px;margin-bottom:20px;margin-right:0;margin-left:0;" >
                </header>
                <div class="main" style="padding-top:40px;padding-bottom:40px;padding-right:40px;padding-left:40px;" >
                		<p style="background: #F4F0EE; font-size: 14px; font-weight: bold; padding: 14px;"><span id="client-name-row">Hello ${ obj.firstName }</span></p>
										<p style="font-weight: 400;">Your account on Memoq has been created.</p>
										<p style="font-weight: 400;">
											<div>Your credentials:</div>
											<div>Login: ${ obj.email }</div>
											<div>Password: 1234</div>
                    </p>
                </div>
                <footer>
                    <hr size="15" color="#66563E">
                    <a class="footer__link" href="https://www.pangea.global" style="display:block;width:100%;text-align:center;padding-top:10px;padding-bottom:15px;padding-right:0;padding-left:0;text-decoration:none;color:#66563E;" >www.pangea.global</a>
                </footer>
            </div>`
}

module.exports = {
	applicationMessage,
	requestMessageForVendor,
	stepCancelledMessage,
	stepMiddleCancelledMessage,
	vendorReassignmentMessage,
	vendorMiddleReassignmentMessage,
	vendorMiddleAssignmentMessage,
	stepReopenedMessage,
	stepReadyToStartMessage,
	sendMemoqCredentials
}