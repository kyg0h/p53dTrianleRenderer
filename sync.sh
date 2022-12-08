#Syncs to my private git repo
git remote remove p53d
git remote add p53d git@github.com:kyg0h/p53dTrianleRenderer.git
git add *
git commit -m "Casual sync"
git push p53d master
