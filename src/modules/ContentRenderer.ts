import {App, MarkdownRenderChild, MarkdownRenderer, TAbstractFile, TFile, TFolder} from "obsidian";
import FolderIndex from "../main";
import {FileHeader} from "../models/FileHeader";

export class ContentRenderer extends MarkdownRenderChild {
	constructor(private app: App, private plugin: FolderIndex, private filePath: string, private container: HTMLElement) {
		super(container)
	}

	async onload() {
		this.plugin.eventManager.on("settingsUpdate", this.onSettingsUpdate.bind(this))
	}


	async onunload() {
		this.plugin.eventManager.off("settingsUpdate", this.onSettingsUpdate.bind(this))
	}

	public onSettingsUpdate(){
		this.render().then()
	}

	private async render() {
		this.container.empty()
		const parent: TFolder = app.vault.getAbstractFileByPath(this.filePath).parent
		const files = parent.children
		await MarkdownRenderer.renderMarkdown(this.buildMarkdownText(files), this.container, this.filePath, this)
	}

	private buildMarkdownText(filtered_files: TAbstractFile[]): string {
		const list: string[] = []

		filtered_files.forEach(value => {
			if (value instanceof TFile) {
				if (value.basename == value.parent.name) {
					return
				}
				const headings = app.metadataCache.getFileCache(value).headings
				const fileLink = app.metadataCache.fileToLinktext(value, this.filePath)
				list.push(`1. [[${fileLink}]]`)
				if (headings != null && !this.plugin.settings.disableHeadlines) {
					for (let i = this.plugin.settings.skipFirstHeadline ? 1 : 0; i < headings.length; i++) {
						const heading = new FileHeader(headings[i])
						const numIndents = new Array(Math.max(1, heading.level - headings[0].level));

						const indent = numIndents.fill("\t").join("");
						list.push(`${indent}1. [[${fileLink}#${heading.rawHeading}|${heading.rawHeading}]]`);
					}
				}
			}

		})

		return list.join("\n")
	}
}
