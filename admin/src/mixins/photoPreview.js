import { mapActions } from "vuex"

export default {
	methods: {
		...mapActions([ 'alertToggle' ]),
		previewPhoto() {
			let input = document.getElementsByClassName('photo-file')[0]
			if (this.checkFile(input.files)) {
				this.showPhoto(input)
			} else {
				this.showFileError(input)
			}
		},
		showPhoto(input) {
			if (this.contact) {
				this.contact.file = input.files[0].name
			}
			this.photoFile = input.files
			this.isImageExist = true
			let reader = new FileReader()
			reader.onload = (e) => {
				document.getElementsByClassName('photo-image')[0].src = e.target.result
			}
			reader.readAsDataURL(input.files[0])
		},
		showFileError(input) {
			this.isFileError = true
			this.alertToggle({ message: "Incorrect file type or size", isShow: true, type: 'error' })
			input.value = ""
			setTimeout(() => {
				this.isFileError = false
			}, 2500)
		},
		checkFile(files) {
			if (files && files[0]) {
				const types = [ 'jpg', 'jpeg', 'png' ]
				const type = files[0].name.split('.').pop()
				return types.indexOf(type.toLowerCase()) !== -1 && files[0].size <= 3000000
			}
			return false
		}
	}
}