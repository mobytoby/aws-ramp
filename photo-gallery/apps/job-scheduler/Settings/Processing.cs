using System;
using System.Collections.Generic;
using System.Text;

namespace job_scheduler.Settings
{
    public class input
    {
        public string imageJob { get; set; }
    }

    public class Processing
    {
        public Greyscale greyscale { get; set; }
    }

    public class Greyscale
    {
        public string BaseUri { get; set; }
    }
}
