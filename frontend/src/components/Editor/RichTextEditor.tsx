import { useRef } from "react";
import FroalaEditor from "react-froala-wysiwyg";

import "froala-editor/css/froala_editor.pkgd.min.css";
import "froala-editor/css/froala_style.min.css";
import "froala-editor/js/plugins.pkgd.min.js";

type EditorProps = {
    initialValue?: string;
    onChange?: (value: string) => void;
};

export default function Editor({ initialValue = "", onChange }: EditorProps) {
    const editorRef = useRef<any>(null);

    const config = {
        placeholderText: "Type here...",
        charCounterCount: true,
        paragraphFormat: {
            P: "Normal",
            H1: "Heading 1",
            H2: "Heading 2",
            H3: "Heading 3",
        },
        toolbarButtons: [
            "paragraphFormat",
            "|",
            "bold",
            "italic",
            "underline",
            "|",
            "formatOL",
            "formatUL",
            "|",
            "alignLeft",
            "alignCenter",
            "alignRight",
            "|",
            "undo",
            "redo",
            "html",
        ],
        quickInsertButtons: ["image", "table", "ul", "ol", "hr", "video", "embed"],
        htmlAllowedTags: [
            "p",
            "h1",
            "h2",
            "h3",
            "ul",
            "ol",
            "li",
            "b",
            "i",
            "u",
            "strong",
            "em",
            "a",
            "br",
            "span",
            "img",
            "table",
            "tr",
            "td",
            "th",
            "iframe",
            "hr",
        ],
        htmlAllowedAttrs: [
            "href",
            "target",
            "class",
            "style",
            "src",
            "alt",
            "width",
            "height",
        ],
    };

    return (
        <div className="prose font-sans text-base">
            <FroalaEditor
                tag="textarea"
                model={initialValue} // ✅ controlled value
                config={config}
                ref={editorRef}
                onModelChange={(content: string) => {
                    const editor = editorRef.current?.getEditor();
                    if (editor) {
                        editor.$el.find("h1").addClass("text-3xl font-bold my-4");
                        editor.$el.find("h2").addClass("text-2xl font-semibold my-3");
                        editor.$el.find("h3").addClass("text-xl font-medium my-2");
                        editor.$el.find("ul").addClass("list-disc list-inside ml-5");
                        editor.$el.find("ol").addClass("list-decimal list-inside ml-5");
                    }
                    if (onChange) onChange(content);
                }}
            />
        </div>
    );
}
