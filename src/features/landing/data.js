// Role catalogue for the landing page. Edit by hand freely.
export const sections = [
  {
    "id": "popular",
    "label": "Popular"
  },
  {
    "id": "product",
    "label": "Product"
  },
  {
    "id": "technology",
    "label": "Technology"
  },
  {
    "id": "ai",
    "label": "AI & ML"
  },
  {
    "id": "data",
    "label": "Data"
  },
  {
    "id": "business",
    "label": "Business"
  },
  {
    "id": "finance",
    "label": "Finance"
  },
  {
    "id": "sales",
    "label": "Sales & GTM"
  },
  {
    "id": "games",
    "label": "Games"
  },
  {
    "id": "care",
    "label": "Health, Law & Education"
  }
];

export const roles = [
  {
    "id": "ai-engineer",
    "title": "AI Engineer",
    "section": "ai",
    "popular": true,
    "tag": "Hot",
    "poster": "/assets/roles/role-ai-engineer.webp",
    "film": "/assets/roles/role-ai-engineer.mp4",
    "projects": [
      "AI Agents & Tool Calling",
      "LLM Evaluation & Guardrails",
      "RAG & Vector Search",
      "Prompt Engineering & Context Management",
      "LLMOps & System Deployment"
    ],
    "tools": [
      {
        "name": "Claude Code",
        "src": "/assets/roles/tools/anthropic.svg",
        "tint": null
      },
      {
        "name": "Python",
        "src": "/assets/roles/tools/python.svg",
        "tint": null
      },
      {
        "name": "LangChain",
        "src": "/assets/roles/tools/si/langchain.svg",
        "tint": "#1C3C3C"
      },
      {
        "name": "Supabase",
        "src": "/assets/roles/tools/supabase.svg",
        "tint": "#3ECF8E"
      }
    ]
  },
  {
    "id": "gtm-engineer",
    "title": "GTM Engineer",
    "section": "sales",
    "popular": true,
    "tag": "Hot",
    "poster": "/assets/roles/role-gtm-engineer.webp",
    "film": "/assets/roles/role-gtm-engineer.mp4",
    "projects": [
      "Autonomous AI Agents for GTM",
      "Data Orchestration & Enrichment",
      "Intent Signals & Website Deanonymization",
      "AI-Powered Outbound Automation",
      "GTM Data Foundations & CRM Modeling"
    ],
    "tools": [
      {
        "name": "HubSpot",
        "src": "/assets/brands/color/hubspot.svg",
        "tint": null
      },
      {
        "name": "Claude",
        "src": "/assets/roles/tools/anthropic.svg",
        "tint": null
      },
      {
        "name": "n8n",
        "src": "/assets/roles/tools/si/n8n.svg",
        "tint": "#EA4B71"
      },
      {
        "name": "OpenAI",
        "src": "/assets/brands/color/openai.svg",
        "tint": null
      }
    ]
  },
  {
    "id": "product-engineer",
    "title": "Product Engineer",
    "section": "product",
    "popular": true,
    "tag": "Trending",
    "poster": "/assets/roles/role-product-engineer.webp",
    "film": "/assets/roles/role-product-engineer.mp4",
    "projects": [
      "AI Integration & Automation",
      "Product Discovery & Prototyping",
      "Growth & Monetization Engineering",
      "Core Feature Development",
      "Performance & Reliability"
    ],
    "tools": [
      {
        "name": "Claude Code",
        "src": "/assets/roles/tools/anthropic.svg",
        "tint": null
      },
      {
        "name": "Next.js",
        "src": "/assets/roles/tools/nextjs.svg",
        "tint": null
      },
      {
        "name": "Supabase",
        "src": "/assets/roles/tools/supabase.svg",
        "tint": "#3ECF8E"
      },
      {
        "name": "Vercel",
        "src": "/assets/roles/tools/vercel.svg",
        "tint": null
      }
    ]
  },
  {
    "id": "forward-deployed-engineer",
    "title": "Forward Deployed Engineer",
    "section": "product",
    "popular": true,
    "tag": "Hot",
    "poster": "/assets/roles/role-forward-deployed-engineer.webp",
    "film": "/assets/roles/role-forward-deployed-engineer.mp4",
    "projects": [
      "Agent Workflows That Act in Customer Systems",
      "Working AI Prototypes Customers Can Try",
      "AI Systems That Pass Security Review",
      "AI Systems You Can Debug and Measure",
      "Deployments That Run Where Customers Need Them"
    ],
    "tools": [
      {
        "name": "Claude Code",
        "src": "/assets/roles/tools/anthropic.svg",
        "tint": null
      },
      {
        "name": "Python",
        "src": "/assets/roles/tools/python.svg",
        "tint": null
      },
      {
        "name": "LangGraph",
        "src": "/assets/roles/tools/si/langgraph.svg",
        "tint": "#1C3C3C"
      },
      {
        "name": "FastAPI",
        "src": "/assets/roles/tools/si/fastapi.svg",
        "tint": "#009688"
      }
    ]
  },
  {
    "id": "ai-native-software-engineer",
    "title": "AI-Native Software Engineer",
    "section": "technology",
    "popular": true,
    "tag": null,
    "poster": "/assets/roles/role-ai-native-software-engineer.webp",
    "film": "/assets/roles/role-ai-native-software-engineer.mp4",
    "projects": [
      "AI Agent Orchestration & Core App Building",
      "LLM Evaluation & System Integrity",
      "AI-Native Security, SLSA & Compliance",
      "Retrieval-Augmented Generation (RAG) & Data Pipelines",
      "Performance Optimization & Edge AI"
    ],
    "tools": [
      {
        "name": "Claude Code",
        "src": "/assets/roles/tools/anthropic.svg",
        "tint": null
      },
      {
        "name": "Cursor",
        "src": "/assets/roles/tools/cursor.svg",
        "tint": null
      },
      {
        "name": "GitHub Copilot",
        "src": "/assets/roles/tools/si/githubcopilot.svg",
        "tint": "#000000"
      },
      {
        "name": "Vercel AI SDK",
        "src": "/assets/roles/tools/vercel.svg",
        "tint": null
      }
    ]
  },
  {
    "id": "data-scientist",
    "title": "Data Scientist",
    "section": "data",
    "popular": true,
    "tag": null,
    "poster": "/assets/roles/role-data-scientist.webp",
    "film": "/assets/roles/role-data-scientist.mp4",
    "projects": [
      "NLP & Generative AI Integration",
      "Statistical Analysis & A/B Testing",
      "Predictive Modeling",
      "Time Series & Anomaly Detection",
      "MLOps & Pipeline Orchestration"
    ],
    "tools": [
      {
        "name": "Python",
        "src": "/assets/roles/tools/python.svg",
        "tint": null
      },
      {
        "name": "Pandas",
        "src": "/assets/roles/tools/pandas.svg",
        "tint": "#150458"
      },
      {
        "name": "Scikit-learn",
        "src": "/assets/roles/tools/si/scikitlearn.svg",
        "tint": "#F7931E"
      },
      {
        "name": "Jupyter Notebook",
        "src": "/assets/roles/tools/jupyter.svg",
        "tint": null
      }
    ]
  },
  {
    "id": "design-engineer",
    "title": "Design Engineer",
    "section": "product",
    "popular": true,
    "tag": "Trending",
    "poster": "/assets/roles/role-design-engineer.webp",
    "film": "/assets/roles/role-design-engineer.mp4",
    "projects": [
      "Rapid UI Prototyping & Generative AI",
      "Design Systems & Token Architecture",
      "Micro-Interactions & Animation",
      "Component-Driven Development",
      "Accessibility & Inclusive Design"
    ],
    "tools": [
      {
        "name": "Claude Code",
        "src": "/assets/roles/tools/anthropic.svg",
        "tint": null
      },
      {
        "name": "Figma",
        "src": "/assets/brands/color/figma.svg",
        "tint": null
      },
      {
        "name": "Next.js",
        "src": "/assets/roles/tools/nextjs.svg",
        "tint": null
      },
      {
        "name": "Tailwind CSS",
        "src": "/assets/roles/tools/si/tailwindcss.svg",
        "tint": "#06B6D4"
      }
    ]
  },
  {
    "id": "business-analyst",
    "title": "Business Analyst",
    "section": "business",
    "popular": false,
    "tag": null,
    "poster": "/assets/roles/role-business-analyst.webp",
    "film": null,
    "projects": [
      "AI System Requirements & Logic Definition",
      "Process Mapping & Agentic Automation",
      "Dynamic Dashboards & Automated Insights",
      "Data Auditing & Semantic Layer Setup",
      "Predictive Modeling & Scenario Analysis"
    ],
    "tools": [
      {
        "name": "SQL (via DBeaver)",
        "src": "/assets/roles/tools/si/dbeaver.svg",
        "tint": "#382923"
      },
      {
        "name": "Microsoft Excel",
        "src": "/assets/roles/tools/si/microsoftexcel.svg",
        "tint": "#217346"
      },
      {
        "name": "Power BI",
        "src": "/assets/roles/tools/si/powerbi.svg",
        "tint": "#F2C811"
      },
      {
        "name": "Claude / ChatGPT",
        "src": "/assets/roles/tools/anthropic.svg",
        "tint": null
      }
    ]
  },
  {
    "id": "investment-banking-analyst",
    "title": "Investment Banking Analyst",
    "section": "finance",
    "popular": false,
    "tag": "Trending",
    "poster": "/assets/roles/role-investment-banking-analyst.webp",
    "film": null,
    "projects": [
      "Three-Statement Models & DCF Valuation",
      "Comps & Trading Multiples Screens"
    ],
    "tools": [
      {
        "name": "Microsoft Excel",
        "src": "/assets/roles/tools/si/microsoftexcel.svg",
        "tint": "#217346"
      },
      {
        "name": "Google Sheets",
        "src": "/assets/roles/tools/googlesheets.svg",
        "tint": null
      },
      {
        "name": "Claude Code",
        "src": "/assets/roles/tools/anthropic.svg",
        "tint": null
      },
      {
        "name": "pandas",
        "src": "/assets/roles/tools/pandas.svg",
        "tint": "#150458"
      }
    ]
  },
  {
    "id": "devops-engineer",
    "title": "DevOps Engineer",
    "section": "technology",
    "popular": false,
    "tag": null,
    "poster": "/assets/roles/role-devops-engineer.webp",
    "film": null,
    "projects": [
      "Observability & AIOps",
      "Internal Developer Platforms (IDP)",
      "Cloud Cost Optimization (FinOps)",
      "Continuous Deployment & GitOps",
      "Infrastructure as Code & Provisioning"
    ],
    "tools": [
      {
        "name": "Kubernetes",
        "src": "/assets/roles/tools/si/kubernetes.svg",
        "tint": "#326CE5"
      },
      {
        "name": "Terraform",
        "src": "/assets/roles/tools/si/terraform.svg",
        "tint": "#844FBA"
      },
      {
        "name": "Docker",
        "src": "/assets/roles/tools/si/docker.svg",
        "tint": "#2496ED"
      },
      {
        "name": "GitHub Actions",
        "src": "/assets/roles/tools/si/githubactions.svg",
        "tint": "#2088FF"
      }
    ]
  },
  {
    "id": "security-engineer",
    "title": "Security Engineer",
    "section": "technology",
    "popular": false,
    "tag": null,
    "poster": "/assets/roles/role-security-engineer.webp",
    "film": null,
    "projects": [
      "AI Systems & Agent Security",
      "Cloud Infrastructure Security",
      "Identity and Access Management",
      "Application Security & DevSecOps",
      "Threat Detection & Incident Response"
    ],
    "tools": [
      {
        "name": "Trivy",
        "src": "/assets/roles/tools/si/trivy.svg",
        "tint": "#1904DA"
      },
      {
        "name": "Terraform",
        "src": "/assets/roles/tools/si/terraform.svg",
        "tint": "#844FBA"
      },
      {
        "name": "OWASP ZAP",
        "src": "/assets/roles/tools/si/owasp.svg",
        "tint": "#000000"
      },
      {
        "name": "Claude Code",
        "src": "/assets/roles/tools/anthropic.svg",
        "tint": null
      }
    ]
  },
  {
    "id": "ai-security-engineer",
    "title": "AI Security Engineer",
    "section": "technology",
    "popular": false,
    "tag": null,
    "poster": "/assets/roles/role-ai-security-engineer.webp",
    "film": null,
    "projects": [
      "Agentic Workflow & MCP Security",
      "Prompt Engineering & LLM Red Teaming",
      "Defensive Guardrails & Input Validation",
      "RAG Security & Data Privacy",
      "AI Threat Modeling & Fundamentals"
    ],
    "tools": [
      {
        "name": "Claude Code",
        "src": "/assets/roles/tools/anthropic.svg",
        "tint": null
      },
      {
        "name": "Hugging Face",
        "src": "/assets/roles/tools/si/huggingface.svg",
        "tint": "#FFD21E"
      },
      {
        "name": "Docker",
        "src": "/assets/roles/tools/si/docker.svg",
        "tint": "#2496ED"
      },
      {
        "name": "GitHub",
        "src": "/assets/roles/tools/si/github.svg",
        "tint": "#181717"
      }
    ]
  },
  {
    "id": "data-center-technician",
    "title": "Data Center Technician",
    "section": "technology",
    "popular": false,
    "tag": null,
    "poster": "/assets/roles/role-data-center-technician.webp",
    "film": null,
    "projects": [
      "Power & Cooling Optimization",
      "Network Cabling & Fabric Management",
      "Hardware Operations & Capacity Planning",
      "Predictive Maintenance & Monitoring",
      "Infrastructure Automation"
    ],
    "tools": [
      {
        "name": "Prometheus",
        "src": "/assets/roles/tools/si/prometheus.svg",
        "tint": "#E6522C"
      },
      {
        "name": "Grafana",
        "src": "/assets/roles/tools/si/grafana.svg",
        "tint": "#F46800"
      },
      {
        "name": "Ansible",
        "src": "/assets/roles/tools/si/ansible.svg",
        "tint": "#EE0000"
      },
      {
        "name": "Python",
        "src": "/assets/roles/tools/python.svg",
        "tint": null
      }
    ]
  },
  {
    "id": "applied-ai-engineer",
    "title": "Applied AI Engineer",
    "section": "ai",
    "popular": false,
    "tag": null,
    "poster": "/assets/roles/role-applied-ai-engineer.webp",
    "film": null,
    "projects": [
      "Agents & Autonomous Workflows",
      "Evaluation & Quality Assurance",
      "Retrieval & Context Management (RAG)",
      "AI Production & Observability",
      "Fine-Tuning & Model Adaptation"
    ],
    "tools": [
      {
        "name": "Claude Code",
        "src": "/assets/roles/tools/anthropic.svg",
        "tint": null
      },
      {
        "name": "Python",
        "src": "/assets/roles/tools/python.svg",
        "tint": null
      },
      {
        "name": "LangGraph",
        "src": "/assets/roles/tools/si/langgraph.svg",
        "tint": "#1C3C3C"
      },
      {
        "name": "Hugging Face",
        "src": "/assets/roles/tools/si/huggingface.svg",
        "tint": "#FFD21E"
      }
    ]
  },
  {
    "id": "llm-engineering",
    "title": "LLM Engineering",
    "section": "ai",
    "popular": false,
    "tag": null,
    "poster": "/assets/roles/role-llm-engineering.webp",
    "film": null,
    "projects": [
      "Post-Training: Alignment, Reasoning & Distillation",
      "Fine-Tune Open Models",
      "Serving, Evals & the $100 Capstone",
      "Quantization & Local Inference",
      "Train a Tiny GPT From Scratch"
    ],
    "tools": [
      {
        "name": "PyTorch",
        "src": "/assets/roles/tools/si/pytorch.svg",
        "tint": "#EE4C2C"
      },
      {
        "name": "Hugging Face (Hub + Transformers + Datasets)",
        "src": "/assets/roles/tools/si/huggingface.svg",
        "tint": "#FFD21E"
      },
      {
        "name": "Modal",
        "src": "/assets/roles/tools/si/modal.svg",
        "tint": "#7FEE64"
      },
      {
        "name": "Weights & Biases",
        "src": "/assets/roles/tools/si/weightsandbiases.svg",
        "tint": "#FFBE00"
      }
    ]
  },
  {
    "id": "machine-learning-engineer",
    "title": "Machine Learning Engineer",
    "section": "ai",
    "popular": false,
    "tag": null,
    "poster": "/assets/roles/role-machine-learning-engineer.webp",
    "film": null,
    "projects": [
      "Large Language Models & RAG",
      "AI Agents & Orchestration",
      "Model Deployment & API Serving",
      "MLOps & Model Monitoring",
      "Core Machine Learning Models"
    ],
    "tools": [
      {
        "name": "Python",
        "src": "/assets/roles/tools/python.svg",
        "tint": null
      },
      {
        "name": "PyTorch",
        "src": "/assets/roles/tools/si/pytorch.svg",
        "tint": "#EE4C2C"
      },
      {
        "name": "Hugging Face Transformers",
        "src": "/assets/roles/tools/si/huggingface.svg",
        "tint": "#FFD21E"
      },
      {
        "name": "Scikit-Learn",
        "src": "/assets/roles/tools/si/scikitlearn.svg",
        "tint": "#F7931E"
      }
    ]
  },
  {
    "id": "mlops-engineer",
    "title": "MLOps Engineer",
    "section": "ai",
    "popular": false,
    "tag": null,
    "poster": "/assets/roles/role-mlops-engineer.webp",
    "film": null,
    "projects": [
      "LLMOps & Prompt Infrastructure",
      "Model Deployment & Serving",
      "Model Monitoring & Drift Detection",
      "Automated Testing & CI/CD Pipelines",
      "Infrastructure as Code & Cost Optimization"
    ],
    "tools": [
      {
        "name": "MLflow",
        "src": "/assets/roles/tools/si/mlflow.svg",
        "tint": "#0194E2"
      },
      {
        "name": "Docker",
        "src": "/assets/roles/tools/si/docker.svg",
        "tint": "#2496ED"
      },
      {
        "name": "FastAPI",
        "src": "/assets/roles/tools/si/fastapi.svg",
        "tint": "#009688"
      },
      {
        "name": "Claude Code",
        "src": "/assets/roles/tools/anthropic.svg",
        "tint": null
      }
    ]
  },
  {
    "id": "data-engineer",
    "title": "Data Engineer",
    "section": "data",
    "popular": false,
    "tag": null,
    "poster": "/assets/roles/role-data-engineer.webp",
    "film": null,
    "projects": [
      "AI-Powered Data Engineering",
      "Cloud Data Warehousing & Lakehouses",
      "Data Quality & Reliability Engineering",
      "Real-time Data Streaming",
      "Workflow Orchestration"
    ],
    "tools": [
      {
        "name": "Python",
        "src": "/assets/roles/tools/python.svg",
        "tint": null
      },
      {
        "name": "dbt (data build tool)",
        "src": "/assets/roles/tools/si/dbt.svg",
        "tint": "#FF694B"
      },
      {
        "name": "Snowflake",
        "src": "/assets/logos/on-dark/snowflake.svg",
        "tint": null
      },
      {
        "name": "Databricks",
        "src": "/assets/roles/tools/si/databricks.svg",
        "tint": "#FF3621"
      }
    ]
  },
  {
    "id": "business-operations-analyst",
    "title": "Business & Operations Analyst",
    "section": "business",
    "popular": false,
    "tag": null,
    "poster": "/assets/roles/role-business-operations-analyst.webp",
    "film": null,
    "projects": [
      "Workflow Automation & AI Integration",
      "Operational Data Analysis",
      "Strategic Business Cases",
      "Performance Monitoring & Dashboards",
      "Process Improvement & QA"
    ],
    "tools": [
      {
        "name": "Google Sheets",
        "src": "/assets/roles/tools/googlesheets.svg",
        "tint": null
      },
      {
        "name": "Claude Code",
        "src": "/assets/roles/tools/anthropic.svg",
        "tint": null
      },
      {
        "name": "Make",
        "src": "/assets/roles/tools/si/make.svg",
        "tint": "#6D00CC"
      },
      {
        "name": "Tableau Public",
        "src": "/assets/roles/tools/si/tableau.svg",
        "tint": "#E97627"
      }
    ]
  },
  {
    "id": "management-consultant",
    "title": "Management Consultant",
    "section": "business",
    "popular": false,
    "tag": null,
    "poster": "/assets/roles/role-management-consultant.webp",
    "film": null,
    "projects": [
      "AI & Digital Transformation Advisory",
      "Data-Driven Diagnostics",
      "Executive Storytelling & Delivery",
      "Change Management Strategy",
      "Strategic Framework Design"
    ],
    "tools": [
      {
        "name": "Claude",
        "src": "/assets/roles/tools/anthropic.svg",
        "tint": null
      },
      {
        "name": "Perplexity",
        "src": "/assets/roles/tools/si/perplexity.svg",
        "tint": "#1FB8CD"
      },
      {
        "name": "Google Slides",
        "src": "/assets/roles/tools/googleslides.svg",
        "tint": "#FBBC04"
      },
      {
        "name": "Google Sheets",
        "src": "/assets/roles/tools/googlesheets.svg",
        "tint": null
      }
    ]
  },
  {
    "id": "project-manager",
    "title": "Project Manager",
    "section": "business",
    "popular": false,
    "tag": null,
    "poster": "/assets/roles/role-project-manager.webp",
    "film": null,
    "projects": [
      "Task & Workflow Automation",
      "Agile Delivery & Sprint Management",
      "Risk & Issue Management",
      "Stakeholder Communication",
      "Product Metrics & Outcome Tracking"
    ],
    "tools": [
      {
        "name": "Jira",
        "src": "/assets/roles/tools/si/jira.svg",
        "tint": "#0052CC"
      },
      {
        "name": "Linear",
        "src": "/assets/roles/tools/si/linear.svg",
        "tint": "#5E6AD2"
      },
      {
        "name": "Notion",
        "src": "/assets/brands/color/notion.svg",
        "tint": null
      },
      {
        "name": "Claude",
        "src": "/assets/roles/tools/anthropic.svg",
        "tint": null
      }
    ]
  },
  {
    "id": "startup-founder",
    "title": "Startup Founder",
    "section": "business",
    "popular": false,
    "tag": null,
    "poster": "/assets/roles/role-startup-founder.webp",
    "film": null,
    "projects": [
      "Product Prototyping & MVP Build",
      "Customer Discovery & Market Validation",
      "Go-To-Market & Acquisition",
      "Fundraising & Pitching",
      "Sales & CRM Automation"
    ],
    "tools": [
      {
        "name": "Claude Code",
        "src": "/assets/roles/tools/anthropic.svg",
        "tint": null
      },
      {
        "name": "Vercel",
        "src": "/assets/roles/tools/vercel.svg",
        "tint": null
      },
      {
        "name": "Supabase",
        "src": "/assets/roles/tools/supabase.svg",
        "tint": "#3ECF8E"
      },
      {
        "name": "Stripe",
        "src": "/assets/brands/color/stripe.svg",
        "tint": null
      }
    ]
  },
  {
    "id": "e-commerce-entrepreneur-ai-native",
    "title": "E-Commerce Entrepreneur (AI-Native)",
    "section": "business",
    "popular": false,
    "tag": null,
    "poster": "/assets/roles/role-e-commerce-entrepreneur-ai-native.webp",
    "film": null,
    "projects": [
      "Agentic Workflows & Multi-Agent Systems",
      "Growth Marketing & AI Creative",
      "AI-Powered Customer Support & Engagement",
      "Personalization & Autonomous Merchandising",
      "Data Analytics & Attribution"
    ],
    "tools": [
      {
        "name": "Shopify",
        "src": "/assets/brands/color/shopify.svg",
        "tint": null
      },
      {
        "name": "Claude",
        "src": "/assets/roles/tools/anthropic.svg",
        "tint": null
      },
      {
        "name": "ChatGPT",
        "src": "/assets/brands/color/openai.svg",
        "tint": null
      },
      {
        "name": "Google Analytics 4 (GA4)",
        "src": "/assets/roles/tools/si/googleanalytics.svg",
        "tint": "#E37400"
      }
    ]
  },
  {
    "id": "financial-analyst",
    "title": "Financial Analyst",
    "section": "finance",
    "popular": false,
    "tag": null,
    "poster": "/assets/roles/role-financial-analyst.webp",
    "film": null,
    "projects": [
      "Financial Modeling & Forecasting",
      "Unit Economics & Pricing Strategy",
      "Strategic Capital Allocation",
      "Risk Assessment & Predictive Analytics",
      "Variance Analysis & Reporting"
    ],
    "tools": [
      {
        "name": "Google Sheets",
        "src": "/assets/roles/tools/googlesheets.svg",
        "tint": null
      },
      {
        "name": "Claude",
        "src": "/assets/roles/tools/anthropic.svg",
        "tint": null
      },
      {
        "name": "Python",
        "src": "/assets/roles/tools/python.svg",
        "tint": null
      },
      {
        "name": "Power BI",
        "src": "/assets/roles/tools/si/powerbi.svg",
        "tint": "#F2C811"
      }
    ]
  },
  {
    "id": "venture-capital-analyst",
    "title": "Venture Capital Analyst",
    "section": "finance",
    "popular": false,
    "tag": null,
    "poster": "/assets/roles/role-venture-capital-analyst.webp",
    "film": null,
    "projects": [
      "Deal Sourcing & Market Mapping",
      "Investment Committee & Thematic Research",
      "Financial Diligence & Unit Economics",
      "Initial Screening & Thesis Alignment",
      "Competitive Intelligence & Market Sizing"
    ],
    "tools": [
      {
        "name": "Claude",
        "src": "/assets/roles/tools/anthropic.svg",
        "tint": null
      },
      {
        "name": "Crunchbase",
        "src": "/assets/roles/tools/si/crunchbase.svg",
        "tint": "#0288D1"
      },
      {
        "name": "Google Sheets",
        "src": "/assets/roles/tools/googlesheets.svg",
        "tint": null
      },
      {
        "name": "Y Combinator Startup Directory",
        "src": "/assets/roles/tools/si/ycombinator.svg",
        "tint": "#F0652F"
      }
    ]
  },
  {
    "id": "ai-native-accountant",
    "title": "AI-Native Accountant",
    "section": "finance",
    "popular": false,
    "tag": null,
    "poster": "/assets/roles/role-ai-native-accountant.webp",
    "film": null,
    "projects": [
      "Month-End Close Acceleration",
      "Continuous Reconciliation & Error Detection",
      "Intelligent Data Ingestion & Bookkeeping",
      "Audit Readiness & Internal Controls",
      "Strategic Forecasting & Cash Flow Modeling"
    ],
    "tools": [
      {
        "name": "Microsoft Excel",
        "src": "/assets/roles/tools/si/microsoftexcel.svg",
        "tint": "#217346"
      },
      {
        "name": "QuickBooks Online",
        "src": "/assets/roles/tools/si/quickbooks.svg",
        "tint": "#2CA01C"
      },
      {
        "name": "Xero",
        "src": "/assets/roles/tools/si/xero.svg",
        "tint": "#13B5EA"
      },
      {
        "name": "Claude",
        "src": "/assets/roles/tools/anthropic.svg",
        "tint": null
      }
    ]
  },
  {
    "id": "account-executive",
    "title": "Account Executive",
    "section": "sales",
    "popular": false,
    "tag": null,
    "poster": "/assets/roles/role-account-executive.webp",
    "film": null,
    "projects": [
      "Discovery & Qualification",
      "Solution Pitching & Demoing",
      "Negotiation & Objection Handling",
      "Closing & Account Handoff",
      "Outreach & Pipeline Generation"
    ],
    "tools": [
      {
        "name": "HubSpot",
        "src": "/assets/brands/color/hubspot.svg",
        "tint": null
      },
      {
        "name": "LinkedIn",
        "src": "/assets/logos/on-dark/linkedin.svg",
        "tint": null
      },
      {
        "name": "ChatGPT",
        "src": "/assets/brands/color/openai.svg",
        "tint": null
      },
      {
        "name": "Google Slides",
        "src": "/assets/roles/tools/googleslides.svg",
        "tint": "#FBBC04"
      }
    ]
  },
  {
    "id": "business-development",
    "title": "Business Development",
    "section": "sales",
    "popular": false,
    "tag": null,
    "poster": "/assets/roles/role-business-development.webp",
    "film": null,
    "projects": [
      "Partnership Strategy & Evaluation",
      "Lead Generation & Data Enrichment",
      "Outreach & Relationship Building",
      "Market & Competitive Intelligence",
      "Pitching & Proposal Creation"
    ],
    "tools": [
      {
        "name": "HubSpot",
        "src": "/assets/brands/color/hubspot.svg",
        "tint": null
      },
      {
        "name": "Claude",
        "src": "/assets/roles/tools/anthropic.svg",
        "tint": null
      },
      {
        "name": "LinkedIn",
        "src": "/assets/logos/on-dark/linkedin.svg",
        "tint": null
      },
      {
        "name": "Zapier",
        "src": "/assets/roles/tools/si/zapier.svg",
        "tint": "#FF4F00"
      }
    ]
  },
  {
    "id": "social-media-influencer-ai-native",
    "title": "Social Media Influencer (AI-Native)",
    "section": "sales",
    "popular": false,
    "tag": null,
    "poster": "/assets/roles/role-social-media-influencer-ai-native.webp",
    "film": null,
    "projects": [
      "AI-Assisted Short-Form Video Workflows",
      "Generative AI Visual & Copy Production",
      "Social Commerce & Conversion Optimization",
      "Predictive Analytics & Audience Strategy",
      "Autonomous Community Management"
    ],
    "tools": [
      {
        "name": "Canva",
        "src": "/assets/roles/tools/canva.svg",
        "tint": "#00C4CC"
      },
      {
        "name": "Claude",
        "src": "/assets/roles/tools/anthropic.svg",
        "tint": null
      },
      {
        "name": "ElevenLabs",
        "src": "/assets/roles/tools/si/elevenlabs.svg",
        "tint": "#000000"
      },
      {
        "name": "Buffer",
        "src": "/assets/roles/tools/si/buffer.svg",
        "tint": "#231F20"
      }
    ]
  },
  {
    "id": "game-developer",
    "title": "Game Developer",
    "section": "games",
    "popular": false,
    "tag": null,
    "poster": "/assets/roles/role-game-developer.webp",
    "film": null,
    "projects": [
      "Playable Prototypes & Core Mechanics",
      "Content, Levels & AI-Assisted Asset Pipelines",
      "Game Feel, Tuning & Balance Decisions",
      "Shipping, Live Ops & Player Data",
      "Performance, Bugs & Multi-Device Readiness"
    ],
    "tools": [
      {
        "name": "Unity",
        "src": "/assets/roles/tools/si/unity.svg",
        "tint": "#1b1d1c"
      },
      {
        "name": "Unreal Engine 5",
        "src": "/assets/roles/tools/si/unrealengine.svg",
        "tint": "#0E1128"
      },
      {
        "name": "Godot",
        "src": "/assets/roles/tools/si/godotengine.svg",
        "tint": "#478CBF"
      },
      {
        "name": "GitHub Copilot",
        "src": "/assets/roles/tools/si/githubcopilot.svg",
        "tint": "#000000"
      }
    ]
  },
  {
    "id": "ai-gameplay-engineer",
    "title": "AI Gameplay Engineer",
    "section": "games",
    "popular": false,
    "tag": null,
    "poster": "/assets/roles/role-ai-gameplay-engineer.webp",
    "film": null,
    "projects": [
      "Agentic NPCs & Behavioral Orchestration",
      "Voice Synthesis & Interactive Dialogue",
      "Automated Playtesting & QA bots",
      "AI-Assisted Content Generation",
      "AI Observability & Cost Optimization"
    ],
    "tools": [
      {
        "name": "Unity Engine",
        "src": "/assets/roles/tools/si/unity.svg",
        "tint": "#1b1d1c"
      },
      {
        "name": "Unreal Engine",
        "src": "/assets/roles/tools/si/unrealengine.svg",
        "tint": "#0E1128"
      },
      {
        "name": "C#",
        "src": "/assets/roles/tools/si/csharp.svg",
        "tint": "#512BD4"
      },
      {
        "name": "Python",
        "src": "/assets/roles/tools/python.svg",
        "tint": null
      }
    ]
  },
  {
    "id": "game-ux-designer-user-researcher",
    "title": "Game UX Designer & User Researcher",
    "section": "games",
    "popular": false,
    "tag": null,
    "poster": "/assets/roles/role-game-ux-designer-user-researcher.webp",
    "film": null,
    "projects": [
      "Usability Testing & Diagnostics",
      "Monetization & Progression UX",
      "Foundational Player Research",
      "Accessibility & Inclusivity",
      "Post-Launch Player Feedback"
    ],
    "tools": [
      {
        "name": "Figma",
        "src": "/assets/brands/color/figma.svg",
        "tint": null
      },
      {
        "name": "Maze",
        "src": "/assets/roles/tools/si/maze.svg",
        "tint": "#000000"
      },
      {
        "name": "Unity",
        "src": "/assets/roles/tools/si/unity.svg",
        "tint": "#1b1d1c"
      },
      {
        "name": "Miro",
        "src": "/assets/roles/tools/si/miro.svg",
        "tint": "#050038"
      }
    ]
  },
  {
    "id": "ai-augmented-doctor",
    "title": "AI-Augmented Doctor",
    "section": "care",
    "popular": false,
    "tag": null,
    "poster": "/assets/roles/role-ai-augmented-doctor.webp",
    "film": null,
    "projects": [
      "Clinical Notes Drafted in Minutes",
      "Patients Triaged Before the Visit",
      "Results Explained and Diagnoses Double-Checked",
      "Clinical AI Tools Stress-Tested Before Go-Live",
      "Chronic Patients Monitored Between Visits"
    ],
    "tools": [
      {
        "name": "Claude",
        "src": "/assets/roles/tools/anthropic.svg",
        "tint": null
      },
      {
        "name": "Python",
        "src": "/assets/roles/tools/python.svg",
        "tint": null
      },
      {
        "name": "Streamlit",
        "src": "/assets/roles/tools/si/streamlit.svg",
        "tint": "#FF4B4B"
      },
      {
        "name": "Supabase",
        "src": "/assets/roles/tools/supabase.svg",
        "tint": "#3ECF8E"
      }
    ]
  },
  {
    "id": "ai-native-lawyer",
    "title": "AI-Native Lawyer",
    "section": "care",
    "popular": false,
    "tag": null,
    "poster": "/assets/roles/role-ai-native-lawyer.webp",
    "film": null,
    "projects": [
      "AI-Assisted Contract Analysis",
      "AI Governance & Compliance Strategy",
      "Legal Knowledge Systems (RAG)",
      "Legal Prompt Engineering & AI Research",
      "Automated Legal Intake & Operations"
    ],
    "tools": [
      {
        "name": "Claude",
        "src": "/assets/roles/tools/anthropic.svg",
        "tint": null
      },
      {
        "name": "Perplexity AI",
        "src": "/assets/roles/tools/si/perplexity.svg",
        "tint": "#1FB8CD"
      },
      {
        "name": "Notion",
        "src": "/assets/brands/color/notion.svg",
        "tint": null
      },
      {
        "name": "Google Workspace",
        "src": "/assets/roles/tools/si/google.svg",
        "tint": "#4285F4"
      }
    ]
  },
  {
    "id": "ai-native-educator",
    "title": "AI-Native Educator",
    "section": "care",
    "popular": false,
    "tag": null,
    "poster": "/assets/roles/role-ai-native-educator.webp",
    "film": null,
    "projects": [
      "Interactive & Agentic Learning",
      "Assessment & Automated Feedback",
      "Adaptive Learning Pathways",
      "Content & Curriculum Generation",
      "Instructional Quality & Ethical AI"
    ],
    "tools": [
      {
        "name": "Claude",
        "src": "/assets/roles/tools/anthropic.svg",
        "tint": null
      },
      {
        "name": "ElevenLabs",
        "src": "/assets/roles/tools/si/elevenlabs.svg",
        "tint": "#000000"
      },
      {
        "name": "Canva",
        "src": "/assets/roles/tools/canva.svg",
        "tint": "#00C4CC"
      },
      {
        "name": "Notion",
        "src": "/assets/brands/color/notion.svg",
        "tint": null
      }
    ]
  }
];
