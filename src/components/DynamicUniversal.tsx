import { FileText, Paperclip, X } from "lucide-react";
import React, { useState, useImperativeHandle, forwardRef } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

type GenericFormSchema<T> = Partial<Record<keyof T, T[keyof T]>>;

interface DynamicFormProps<T> {
  schema: GenericFormSchema<T>;
  onSubmit: (data: T) => void;
  layout?: Record<string, number>;
}

export type DynamicFormRef = {
  submitForm: () => void;
};

type InputType =
  | "text"
  | "number"
  | "email"
  | "url"
  | "date"
  | "checkbox"
  | "file"
  | "password"
  | "textarea"
  | "group"
  | "color"
  | "select";

const detectInputType = (key: string, value: unknown): InputType => {
  const lower = key.toLowerCase();

  // Special cases first
  if (lower.includes("file") || lower.includes("attachment") || lower.includes("upload"))
    return "file";

  if (typeof value === "boolean") return "checkbox";
  if (typeof value === "number") return "number";
  if (Array.isArray(value)) {
    // Detect file arrays
    if (value.length > 0 && typeof value[0] === "object" && "filename" in value[0])
      return "file";
    return "textarea";
  }

  if (typeof value === "object" && value !== null) return "group";
  if (lower.includes("email")) return "email";
  if (lower.includes("url") || lower.includes("link")) return "url";
  if(lower.includes("status")) return "select";
  if (lower.includes("password")) return "password";
  if (lower.includes("color")) return "color";
  if (lower.includes("date") || value instanceof Date) return "date";
  if (lower.includes("description") || lower.includes("details")) return "textarea";

  return "text";
};

//component
export const DynamicForm = forwardRef(function DynamicForm<T extends Record<string, unknown>>(
  { schema, onSubmit, layout }: DynamicFormProps<T>,
  ref: React.Ref<DynamicFormRef>,
) {
  const [formData, setFormData] = useState<Partial<T>>({});
  const [dragActive, setDragActive] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
// console.log("Layout received:", layout);

  const handleSubmit = () => {
    onSubmit(formData as T);

    // Reset form state based on schema-detected input types
    const resetState: Partial<Record<keyof T, unknown>> = {};
    Object.entries(schema).forEach(([key, value]) => {
      const type = detectInputType(key, value);
      const k = key as keyof T;
      if (type === "checkbox") {
        resetState[k] = false;
      } else if (type === "file") {
        resetState[k] = [];
      } else {
        resetState[k] = "";
      }
      console.log("Rendering field:", key, "layout span:", layout?.[key]);
    });
    
    setFormData(resetState as Partial<T>);
    setDragActive(false);
  };
const handleFileSelect = (name: string, files: FileList | null) => {
  if (!files) return;
  setFormData((prev) => ({
    ...prev,
    [name]: Array.from(files),
  }));
};

const handleDrop = (e: React.DragEvent<HTMLDivElement>, name: string) => {
  e.preventDefault();
  e.stopPropagation();
  setDragActive(false);
  handleFileSelect(name, e.dataTransfer.files);
};

const handleRemoveFile = (name: string, index: number) => {
  setFormData((prev) => {
    const updated = Array.isArray(prev[name as keyof T])
      ? [...(prev[name as keyof T] as File[])].filter((_, i) => i !== index)
      : [];
    return { ...prev, [name]: updated as unknown };
  });
};

  // 👇 Expose submit method to parent
  useImperativeHandle(ref, () => ({
    submitForm: handleSubmit,
  }));
  
  return (
    <form
    onSubmit={(e) => {
      e.preventDefault();
      handleSubmit();
    }}
    className="rounded-md p-6 space-y-6 bg-white h-full"
    >
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 capitalize">
      {Object.entries(schema).map(([key, value]) => {
    const colSpanClass = (layout?.[key] ?? 1) === 2 ? "md:col-span-2" : "md:col-span-1";
        const fieldType = detectInputType(key, value);
        const fieldValue = formData[key as keyof T] ?? "";
        if (fieldType === "group") return null;

        const isReadOnly = key.toLowerCase().includes("reference");

        return (
         <div
  key={key}
 className={`flex flex-col ${colSpanClass}`}
>

            {/* Label */}
            <label className="text-sm font-semibold text-sky-800 mb-1">
              {key.replace(/([A-Z])/g, " $1")}
            </label>

            {/* ---- SELECT ---- */}
            {fieldType === "select" ? (
            <select
    name={key}
    value={String(fieldValue)}
    onChange={handleChange}
    className="border border-sky-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-sky-400 outline-none"
  >
    <option value="">Select {key}</option>

    {/* ✅ Dynamic select options */}
    {(() => {
      const schemaWithOptions = schema as T & {
        _selectOptions?: Record<string, string[]>;
      };

      const options = schemaWithOptions._selectOptions?.[key] ?? [];

      return options.map((opt) => (
        <option key={opt} value={opt}>
          {opt.charAt(0).toUpperCase() + opt.slice(1)}
        </option>
      ));
    })()}
  </select>

           /* ---- TEXTAREA ---- */
) : fieldType === "textarea" ? (
  <ReactQuill
    theme="snow"
    value={String(fieldValue || "")}
    onChange={(content) =>
      setFormData((prev) => ({
        ...prev,
        [key]: content,
      }))
    }
    className="border border-sky-200 rounded-md min-h-[200px] bg-white"
    modules={{
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        ["blockquote", "code-block"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image"],
        ["clean"],
      ],
    }}
    placeholder={`Enter ${key}`}
  />


            /* ---- FILE UPLOAD SECTION ---- */
            ) : fieldType === "file" ? (
              <div className="border border-sky-200 rounded-md overflow-hidden">
                <div className="bg-sky-700 text-white px-3 py-2 font-semibold">
                  Attachments
                </div>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => handleDrop(e, key)}
                  className={`p-4 transition-all min-h-[120px] ${
                    dragActive ? "bg-sky-50 border-2 border-dashed border-sky-500" : ""
                  }`}
                >
                  {/* Uploaded file list */}
                  {Array.isArray(formData[key as keyof T]) &&
                    (formData[key as keyof T] as File[]).map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-sky-50 border border-sky-100 rounded-md px-3 py-2 mb-2"
                      >
                        <div className="flex items-center gap-2 text-sm text-sky-800">
                          <FileText size={16} className="text-sky-700"/>
                          <span>{file.name}</span>
                          <em className="text-gray-500 text-xs">Unsaved</em>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(key, idx)}
                          className="text-sky-600 "
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}

                  {/* Upload input */}
                  <label className="flex items-center gap-2 text-sky-700 font-medium cursor-pointer w-fit">
                    <Paperclip size={18} className="text-sky-700"/>
                    <span>Attach file</span>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFileSelect(key, e.target.files)}
                    />
                  </label>
                </div>
              </div>

            /* ---- DEFAULT INPUT ---- */
            ) : (
              <input
                name={key}
                type={fieldType}
                value={String(fieldValue)}
                onChange={handleChange}
                className={`border border-sky-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-sky-400 outline-none ${
                  isReadOnly ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
                readOnly={isReadOnly}
                placeholder={`Enter ${key}`}
              />
            )}
          </div>
        );
      })}
    </div>
  </form>
);

});
