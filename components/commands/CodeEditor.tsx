"use client";

import React, { useState, useEffect } from "react";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-css";
import "prismjs/components/prism-json";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-markup"; // html
import "prismjs/themes/prism-tomorrow.css"; // Dark theme
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Copy, Check } from "lucide-react";

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    language: string;
    onLanguageChange: (language: string) => void;
    className?: string;
}

const SUPPORTED_LANGUAGES = [
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "csharp", label: "C#" },
    { value: "cpp", label: "C++" },
    { value: "markup", label: "HTML/XML" },
    { value: "css", label: "CSS" },
    { value: "bash", label: "Bash" },
    { value: "sql", label: "SQL" },
    { value: "json", label: "JSON" },
];

export function CodeEditor({
    value,
    onChange,
    language,
    onLanguageChange,
    className,
}: CodeEditorProps) {
    const [lineNumbers, setLineNumbers] = useState<number[]>([1]);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const lines = value.split("\n").length;
        setLineNumbers(Array.from({ length: lines }, (_, i) => i + 1));
    }, [value]);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={cn("flex flex-col border border-border/40 rounded-xl overflow-hidden bg-[#1e1e1e] shadow-sm", className)}>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={language} onValueChange={onLanguageChange}>
                        <SelectTrigger className="h-7 w-[140px] bg-transparent border-white/10 text-xs text-muted-foreground hover:text-white hover:bg-white/5 focus:ring-0 focus:ring-offset-0">
                            <SelectValue placeholder="Select Language" />
                        </SelectTrigger>
                        <SelectContent>
                            {SUPPORTED_LANGUAGES.map((lang) => (
                                <SelectItem key={lang.value} value={lang.value}>
                                    {lang.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <button
                        onClick={handleCopy}
                        type="button"
                        className="text-muted-foreground hover:text-white transition-colors"
                        title="Copy code"
                    >
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex relative items-stretch min-h-[300px] max-h-[600px] bg-[#1e1e1e] overflow-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {/* Line Numbers */}
                <div className="flex flex-col items-end px-3 py-4 text-right bg-[#1e1e1e] border-r border-white/5 select-none min-w-[3rem]">
                    {lineNumbers.map((num) => (
                        <span key={num} className="text-xs text-gray-600 font-mono leading-[24px]">
                            {num}
                        </span>
                    ))}
                </div>

                {/* Code Editor */}
                <div className="flex-1 relative font-mono text-sm">
                    <style jsx global>{`
                        textarea, pre {
                            outline: none !important;
                        }
                    `}</style>
                    <Editor
                        value={value}
                        onValueChange={onChange}
                        highlight={(code: string) => highlight(code, languages[language] || languages.javascript, language)}
                        padding={16}
                        textareaClassName="focus:outline-none"
                        className="font-mono min-h-[300px]"
                        style={{
                            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                            fontSize: 14,
                            lineHeight: "24px",
                            backgroundColor: "#1e1e1e",
                            minHeight: "300px",
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
