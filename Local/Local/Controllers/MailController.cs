//mailcontroler.cs

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.IO;
using System.Threading.Tasks;
using System;
using System.Threading;
namespace LocalMailApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class MailController : ControllerBase
    {
        [HttpPost("sendMail")]
        public async Task<IActionResult> SendMail()
        {
            try
            {
                var form = await Request.ReadFormAsync();
                string subject = form["subject"];
                string body = form["body"];
                var recipients = form["recipients[]"];
                if (string.IsNullOrEmpty(subject) || string.IsNullOrEmpty(body) || recipients.Count == 0)
                {
                    return BadRequest(new { status = "error", message = "נתונים חסרים" });
                }
                string tempFilePath = null;
                IFormFile attachment = form.Files["attachment"];
                if (attachment != null && attachment.Length > 0)
                {
                    tempFilePath = Path.Combine(Path.GetTempPath(), attachment.FileName);
                    using (var stream = new FileStream(tempFilePath, FileMode.Create))
                    {
                        await attachment.CopyToAsync(stream);
                    }
                }
                Exception threadException = null;
                Thread staThread = new Thread(() =>
                {
                    try
                    {
                        var outlookApp = new Microsoft.Office.Interop.Outlook.Application();
                        foreach (var recipient in recipients)
                        {
                            var mail = (Microsoft.Office.Interop.Outlook.MailItem)
                                outlookApp.CreateItem(Microsoft.Office.Interop.Outlook.OlItemType.olMailItem);
                            mail.Subject = subject;
                            mail.Body = body;
                            mail.To = recipient;
                            if (!string.IsNullOrEmpty(tempFilePath) && System.IO.File.Exists(tempFilePath))
                            {
                                mail.Attachments.Add(tempFilePath,
                                    Microsoft.Office.Interop.Outlook.OlAttachmentType.olByValue,
                                    Type.Missing, Type.Missing);
                            }
                            mail.Save();
                        }
                    }
                    catch (Exception ex)
                    {
                        threadException = ex;
                    }
                });
                staThread.SetApartmentState(ApartmentState.STA);
                staThread.Start();
                staThread.Join();
                if (threadException != null)
                    throw threadException;
                if (!string.IsNullOrEmpty(tempFilePath) && System.IO.File.Exists(tempFilePath))
                    System.IO.File.Delete(tempFilePath);
                return Ok(new { status = "success", message = "טיוטות נוצרו בהצלחה" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { status = "error", message = ex.ToString() });
            }
        }
    }
}