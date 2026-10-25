// Host RAM and per-GPU memory follow AWS's accelerated-instance table. Replace GPU capacity with nvidia-smi on the launched AMI.
export const hardware={
 'g6.2xlarge':{cpu:8,ram:32,vram:22,gpu:'NVIDIA L4',marketedGB:24,monthlyUSD:900},
 'g6e.2xlarge':{cpu:8,ram:64,vram:44,gpu:'NVIDIA L40S',marketedGB:48,monthlyUSD:1800},
 'g7e.2xlarge':{cpu:8,ram:64,vram:96,gpu:'NVIDIA RTX PRO 6000 Blackwell',marketedGB:96,monthlyUSD:2600,nativeNVFP4:true}
};
