import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Loader2, Download, Users } from "lucide-react";
import type { FileUploadResponse } from "@shared/schema";

export default function UploadMappings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<FileUploadResponse | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();

      return new Promise<FileUploadResponse>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(xhr.responseText || "Upload failed"));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Network error occurred"));
        });

        xhr.open("POST", "/api/admin/upload/mappings");
        xhr.send(formData);
        xhr.withCredentials = true;   // 🔴 REQUIRED
        xhr.send(formData);
      });
    },
    onSuccess: (data) => {
      setUploadResult(data);
      if (data.success) {
        toast({
          title: "Upload Successful",
          description: `Processed ${data.recordsProcessed} student-staff mappings`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadResult({
        success: false,
        message: error.message,
      });
    },
    onSettled: () => {
      setUploadProgress(0);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setSelectedFile(null);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-medium" data-testid="text-page-title">
          Upload Student-Staff Mappings
        </h1>
        <p className="text-muted-foreground">
          Upload files that define which students are assigned to which staff for each subject
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            File Upload
          </CardTitle>
          <CardDescription>
            This data is used to route OD requests to the correct staff members
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`relative border-2 border-dashed rounded-md p-8 text-center transition-colors ${
              selectedFile ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              data-testid="input-file-mappings"
            />
            {selectedFile ? (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium" data-testid="text-filename">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFile();
                    }}
                    data-testid="button-clear-file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="font-medium">Drop your file here or click to browse</p>
                  <p className="text-sm text-muted-foreground">
                    Supports XLSX and CSV files
                  </p>
                </div>
              </div>
            )}
          </div>

          {uploadMutation.isPending && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={clearFile}
              disabled={!selectedFile || uploadMutation.isPending}
              data-testid="button-reset"
            >
              Reset
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploadMutation.isPending}
              data-testid="button-upload"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Mappings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {uploadResult && (
        <Alert variant={uploadResult.success ? "default" : "destructive"}>
          {uploadResult.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {uploadResult.success ? "Upload Successful" : "Upload Failed"}
          </AlertTitle>
          <AlertDescription className="mt-2">
            <p>{uploadResult.message}</p>
            {uploadResult.recordsProcessed !== undefined && (
              <p className="mt-1">Records processed: {uploadResult.recordsProcessed}</p>
            )}
            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <ul className="mt-2 list-disc list-inside text-sm">
                {uploadResult.errors.slice(0, 5).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
                {uploadResult.errors.length > 5 && (
                  <li>...and {uploadResult.errors.length - 5} more errors</li>
                )}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">File Format Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Column</th>
                  <th className="text-left p-2 font-medium">Description</th>
                  <th className="text-left p-2 font-medium">Example</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2">StudentID</td>
                  <td className="p-2 text-muted-foreground">Unique student identifier</td>
                  <td className="p-2 font-mono text-xs">STU001</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">StaffID</td>
                  <td className="p-2 text-muted-foreground">Staff member ID</td>
                  <td className="p-2 font-mono text-xs">STAFF001</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">SubjectCode</td>
                  <td className="p-2 text-muted-foreground">Subject code</td>
                  <td className="p-2 font-mono text-xs">CS101</td>
                </tr>
                <tr>
                  <td className="p-2">SubjectName</td>
                  <td className="p-2 text-muted-foreground">Subject name</td>
                  <td className="p-2 font-mono text-xs">Data Structures</td>
                </tr>
              </tbody>
            </table>
          </div>
          <Button variant="outline" className="gap-2" data-testid="button-download-template">
            <Download className="h-4 w-4" />
            Download Template
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
